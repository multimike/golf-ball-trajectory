import {vec_add, vec_cross, vec_length, vec_normalize, vec_scale, vec_sub, Vec3} from "../util/vec3.ts"
import {LaunchProperties} from "./launch-properties.ts"
import {Atmosphere, defaultAtmosphere} from "./atmosphere.ts"
import {rk4Step} from "./rk4.ts"
import {AerodynamicCoefficients, defaultAerodynamicCoefficients} from "./aerodynamic-coefficients.ts"
import {BallState, BallTrajectory} from "./trajectory.ts"
import {sigmoid} from "../util/math.ts"

const MphToMps = 0.44704
const DegToRad = Math.PI / 180
const RpmToRadSec = Math.PI / 30

const BallMass = 0.0459				// kg
const BallRadius = 0.0213			// m
const Area = Math.PI * BallRadius * BallRadius // m^2
const Gravity = 9.81				// m/s^2
const KinematicViscosity = 1.48e-5	// m^2/s for calculating Reynolds number

const GasConstantDryAir = 287.05
const GasConstantWaterVapor = 461.495
const WindZ0 = 0.01				// Aerodynamic roughness of short grass (m)
const WindRefHeight = 10.0		// Height at which 'baseWind' is measured (m)

const Dt = 0.02
const MaxTrajectoryPoints = 2500

type Derivatives = {
	dPos: Vec3
	dVel: Vec3
	dSpin: Vec3
}

function scaleDerivatives(derivatives: Derivatives, scale: number): Derivatives {
	return {
		dPos: vec_scale(derivatives.dPos, scale),
		dVel: vec_scale(derivatives.dVel, scale),
		dSpin: vec_scale(derivatives.dSpin, scale)
	}
}

function addDerivatives(a: Derivatives, b: Derivatives, c: Derivatives, d: Derivatives): Derivatives {
	return {
		dPos: vec_add(a.dPos, b.dPos, c.dPos, d.dPos),
		dVel: vec_add(a.dVel, b.dVel, c.dVel, d.dVel),
		dSpin: vec_add(a.dSpin, b.dSpin, c.dSpin, d.dSpin)
	}
}

// Helper to calculate forces and accelerations (The "Physics Engine")
function getDerivatives(state: BallState, baseWind: Vec3, rho: number, aerodynamicCoefficients: AerodynamicCoefficients): Derivatives {
	// 1. Logarithmic Wind Gradient
	// Wind is slower near the ground due to friction.
	let windSpeedMult = 0
	if (state.position.y > 0) {
		windSpeedMult = Math.log((state.position.y + WindZ0) / WindZ0) /
			Math.log((WindRefHeight + WindZ0) / WindZ0)
	}
	const currentWind = vec_scale(baseWind, windSpeedMult)

	// 2. Relative Velocity & Core Metrics
	const relativeVelocity = vec_sub(state.velocity, currentWind)
	const relativeSpeed = vec_length(relativeVelocity)

	// Safety check to prevent divide-by-zero at apex/rest
	if (relativeSpeed < 0.001) {
		return {
			dPos: { ...state.velocity },
			dVel: { x: 0, y: -Gravity, z: 0 },
			dSpin: { x: 0, y: 0, z: 0 }
		}
	}

	const relativeSpeedSq = relativeSpeed * relativeSpeed
	const currentOmegaMag = vec_length(state.spin)
	const s = (BallRadius * currentOmegaMag) / relativeSpeed
	const reynolds = (relativeSpeed * 2 * BallRadius) / KinematicViscosity

	// 3. The "Drag Crisis" (Reynolds Number Curve)
	// Dimples cause C_d to drop from ~0.5 at low speeds to ~0.22 at high speeds.
	// This simple logistic approximation mirrors the sudden drop around Re = 50,000.
	// const baseCd = 0.22 + 0.28 / (1 + Math.exp((reynolds - 50000) / 10000))

	// https://www.scirp.org/journal/paperinformation?paperid=85529
	const highSpeedFactor = sigmoid((reynolds - aerodynamicCoefficients.dragCrisisReynolds) / aerodynamicCoefficients.dragCrisisReynoldsWidth)
	const baseCd =
		aerodynamicCoefficients.lowSpeedDragCoeff * (1 - highSpeedFactor) +
		aerodynamicCoefficients.highSpeedDragCoeff * highSpeedFactor

	// 4. Calculate Coefficients
	const cd = baseCd + aerodynamicCoefficients.dragSpinCoeff * Math.pow(s, aerodynamicCoefficients.dragSpinExponent)
	const cl = aerodynamicCoefficients.liftSpinCoeff * Math.pow(s, aerodynamicCoefficients.liftSpinExponent)
	// const cl = 0.45 * (1 - Math.exp(-5 * s))
	// const cl = 1.5 * s

	// mach speeds should not affect trajectory much when under 30% of the speed of sound
	// const mach = relativeSpeed / SpeedOfSound
	// const cdCompressible = cd * (1 + aerodynamicCoefficients.compressibilityCoeff * mach * mach)

	// 5. Calculate Forces
	// Drag
	const fd = 0.5 * rho * Area * cd * relativeSpeedSq
	const dragForce = vec_scale(vec_normalize(relativeVelocity), -fd)

	// Lift (Magnus Effect)
	const cross = vec_cross(state.spin, relativeVelocity)
	const cmag = vec_length(cross)
	let liftForce = { x: 0, y: 0, z: 0 }
	if (cmag > 0) {
		const fl = 0.5 * rho * Area * cl * relativeSpeedSq
		liftForce = vec_scale(vec_normalize(cross), fl)
	}

	// Gravity
	const gravityForce = { x: 0, y: -BallMass * Gravity, z: 0 }

	// Total Acceleration
	const totalForce = vec_add(dragForce, liftForce, gravityForce)
	const acceleration = vec_scale(totalForce, 1 / BallMass)

	// spin decay (per second) is part of the aerodynamic model for fitting.
	const angularAcceleration = vec_scale(state.spin, -aerodynamicCoefficients.spinDecayPerSecond)

	// Return the rates of change (derivatives)
	return {
		dPos: { ...state.velocity },
		dVel: acceleration,
		dSpin: angularAcceleration
	}
}

// Helper to advance state using RK4 derivatives
function addScaledDerivativeToState(state: BallState, deriv: Derivatives, dt: number): BallState {
	return {
		position: vec_add(state.position, vec_scale(deriv.dPos, dt)),
		velocity: vec_add(state.velocity, vec_scale(deriv.dVel, dt)),
		spin: vec_add(state.spin, vec_scale(deriv.dSpin, dt)),
		timeS: state.timeS + dt
	}
}

function calculateAirDensity(atmosphere: Atmosphere): number {
	const temperatureKelvin = Math.max(180, atmosphere.airTemperatureC + 273.15)
	const relativeHumidity = Math.min(100, Math.max(0, atmosphere.relativeHumidity))
	const airPressure = Math.max(10000, atmosphere.airPressure)

	// Tetens formula for saturation vapor pressure over water (Pa)
	const saturationVaporPressure = 610.94 * Math.exp((17.625 * atmosphere.airTemperatureC) / (atmosphere.airTemperatureC + 243.04))
	const vaporPressure = (relativeHumidity / 100) * saturationVaporPressure
	const dryAirPressure = Math.max(0, airPressure - vaporPressure)

	return (
		dryAirPressure / (GasConstantDryAir * temperatureKelvin) +
		vaporPressure / (GasConstantWaterVapor * temperatureKelvin)
	)
}

export function simulateTrajectory(
	launch: LaunchProperties,
	atmosphere: Atmosphere = defaultAtmosphere,
	aerodynamicCoefficients: AerodynamicCoefficients = defaultAerodynamicCoefficients,
): BallTrajectory {
	const v0 = launch.speed * MphToMps
	const theta = launch.launchDirection.launchAngle * DegToRad
	const phi = launch.launchDirection.azimuthAngle * DegToRad
	const alpha = launch.ballSpin.axis * DegToRad
	const omegaMag = launch.ballSpin.rpm * RpmToRadSec

	const rho = calculateAirDensity(atmosphere)
	const windDirectionRad = atmosphere.windDirection * DegToRad
	const wind = {
		x: atmosphere.windSpeed * Math.cos(windDirectionRad),
		y: 0,
		z: atmosphere.windSpeed * Math.sin(windDirectionRad),
	}

	// setup initial ball state
	let position = {x: 0, y: 0, z: 0}

	let velocity = {
		x: v0 * Math.cos(theta) * Math.cos(phi),
		y: v0 * Math.sin(theta),
		z: v0 * Math.cos(theta) * Math.sin(phi),
	}

	let spin = {
		x: 0,
		y: -omegaMag * Math.sin(alpha),
		z: omegaMag * Math.cos(alpha),
	}

	let ballState = {
		position,
		velocity,
		spin,
		timeS: 0
	}

	const trajectory: BallState[] = [ballState]

	while (ballState.position.y >= 0 && trajectory.length < MaxTrajectoryPoints) {
		ballState = rk4Step(
			ballState,
			Dt,
			(currentState) => getDerivatives(currentState, wind, rho, aerodynamicCoefficients),
			addScaledDerivativeToState,
			scaleDerivatives,
			addDerivatives
		)

		if (ballState.position.y >= 0) {
			trajectory.push(ballState)
		}
	}
	return trajectory
}
