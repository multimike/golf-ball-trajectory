import {AerodynamicCoefficients, defaultAerodynamicCoefficients} from "../simulation/aerodynamic-coefficients.ts"
import {Atmosphere, defaultAtmosphere} from "../simulation/atmosphere.ts"
import {LaunchProperties} from "../simulation/launch-properties.ts"
import {simulateTrajectory} from "../simulation/simulation.ts"
import {BallTrajectoryStats, traj_stats} from "../simulation/trajectory.ts"

const MphToMps = 0.44704
const MinDenominator = 1e-6

export type FitCoefficientKey = keyof AerodynamicCoefficients

const CoefficientKeys: FitCoefficientKey[] = [
	"lowSpeedDragCoeff",
	"highSpeedDragCoeff",
	"dragCrisisReynolds",
	"dragCrisisReynoldsWidth",
	"dragSpinCoeff",
	"dragSpinExponent",
	"liftSpinCoeff",
	"liftSpinExponent",
	"spinDecayPerSecond"
]

const CoefficientBounds: Record<FitCoefficientKey, [number, number]> = {
	lowSpeedDragCoeff: [0.4, 1.0],
	highSpeedDragCoeff: [0.1, 0.4],
	dragCrisisReynolds: [20000, 120000],
	dragCrisisReynoldsWidth: [2000, 30000],
	dragSpinCoeff: [0, 6],
	dragSpinExponent: [0, 4],
	liftSpinCoeff: [0, 2],
	liftSpinExponent: [0, 2],
	spinDecayPerSecond: [-0.2, 0.2]
}

type NumericLike = number | string

type FlightScopeRow = {
	LaunchElev: NumericLike
	LaunchSpeed: NumericLike
	BackSpin: NumericLike
	CarryDist: NumericLike
	FlightTime: NumericLike
	Height: NumericLike
	ImpactElev: NumericLike
}

export type TrajectoryTrainingSample = {
	launchElevationDeg: number
	launchSpeedMps: number
	backSpinRpm: number
	carryDistM: number
	flightTimeS: number
	apexM: number
	landingAngleDeg: number
}

export type FitWeights = {
	distance: number
	flightTime: number
	apex: number
	landingAngle: number
}

export type FitProgressPoint = {
	iteration: number
	coefficients: AerodynamicCoefficients
	meanWeightedSquaredError: number
	distanceRmseM: number
	flightTimeRmseS: number
	apexRmseM: number
	landingAngleRmseDeg: number
}

export type FitOptions = {
	atmosphere?: Atmosphere
	initialCoefficients?: AerodynamicCoefficients
	initialSteps?: Partial<AerodynamicCoefficients>
	fitKeys?: FitCoefficientKey[]
	weights?: Partial<FitWeights>
	maxIterations?: number
	minStepSize?: number
	yieldEveryIterations?: number
	onProgress?: (progressPoint: FitProgressPoint) => void
}

export type TrainingSampleFit = {
	target: TrajectoryTrainingSample
	stats: BallTrajectoryStats
	distanceErrorM: number
	flightTimeErrorS: number
	apexErrorM: number
	landingAngleErrorDeg: number
}

export type SimulateTrajectoryFitResult = {
	coefficients: AerodynamicCoefficients
	meanWeightedSquaredError: number
	distanceRmseM: number
	flightTimeRmseS: number
	apexRmseM: number
	landingAngleRmseDeg: number
	iterations: number
	converged: boolean
	sampleCount: number
	sampleFits: TrainingSampleFit[]
	progress: FitProgressPoint[]
}

export function getDefaultFitCoefficientKeys(): FitCoefficientKey[] {
	return [...CoefficientKeys]
}

type Evaluation = {
	meanWeightedSquaredError: number
	distanceRmseM: number
	flightTimeRmseS: number
	apexRmseM: number
	landingAngleRmseDeg: number
	sampleFits: TrainingSampleFit[]
}

export function parseFlightScopeTrainingJson(jsonText: string): TrajectoryTrainingSample[] {
	// Files can contain trailing commas, which are invalid JSON.
	const normalized = jsonText.replace(/,\s*([}\]])/g, "$1")
	const parsed: unknown = JSON.parse(normalized)

	if (!Array.isArray(parsed)) {
		throw new Error("Expected training JSON file to contain an array")
	}

	return parsed.map((row, index) => parseFlightScopeRow(row, index))
}

export function fitSimulateTrajectoryToTrainingJson(
	trainingJsonTexts: string[],
	options: FitOptions = {}
): SimulateTrajectoryFitResult {
	const samples = trainingJsonTexts.flatMap((jsonText) => parseFlightScopeTrainingJson(jsonText))
	return fitSimulateTrajectoryToSamples(samples, options)
}

export async function fitSimulateTrajectoryToTrainingJsonAsync(
	trainingJsonTexts: string[],
	options: FitOptions = {}
): Promise<SimulateTrajectoryFitResult> {
	const samples = trainingJsonTexts.flatMap((jsonText) => parseFlightScopeTrainingJson(jsonText))
	return fitSimulateTrajectoryToSamplesAsync(samples, options)
}

export function fitSimulateTrajectoryToSamples(
	samples: TrajectoryTrainingSample[],
	options: FitOptions = {}
): SimulateTrajectoryFitResult {
	if (samples.length === 0) {
		throw new Error("At least one training sample is required")
	}

	const atmosphere = options.atmosphere ?? defaultAtmosphere
	const weights = {
		distance: options.weights?.distance ?? 5,
		flightTime: options.weights?.flightTime ?? 1,
		apex: options.weights?.apex ?? 1,
		landingAngle: options.weights?.landingAngle ?? 1
	}
	const minStepSize = options.minStepSize ?? 0.001
	const maxIterations = options.maxIterations ?? 40
	const fitKeys = options.fitKeys && options.fitKeys.length > 0 ? options.fitKeys : CoefficientKeys

	let coefficients = cloneCoefficients(options.initialCoefficients ?? defaultAerodynamicCoefficients)
	let steps: AerodynamicCoefficients = {
		lowSpeedDragCoeff: options.initialSteps?.lowSpeedDragCoeff ?? 0.02,
		highSpeedDragCoeff: options.initialSteps?.highSpeedDragCoeff ?? 0.01,
		dragCrisisReynolds: options.initialSteps?.dragCrisisReynolds ?? 4000,
		dragCrisisReynoldsWidth: options.initialSteps?.dragCrisisReynoldsWidth ?? 2000,
		dragSpinCoeff: options.initialSteps?.dragSpinCoeff ?? 0.15,
		dragSpinExponent: options.initialSteps?.dragSpinExponent ?? 0.08,
		liftSpinCoeff: options.initialSteps?.liftSpinCoeff ?? 0.08,
		liftSpinExponent: options.initialSteps?.liftSpinExponent ?? 0.05,
		spinDecayPerSecond: options.initialSteps?.spinDecayPerSecond ?? 0.005
	}

	let evaluation = evaluateCoefficients(samples, coefficients, atmosphere, weights)
	let converged = false
	let iteration = 0
	const progress: FitProgressPoint[] = []

	recordProgress(progress, options, 0, coefficients, evaluation)

	for (iteration = 0; iteration < maxIterations; iteration++) {
		let improved = false

		for (const key of fitKeys) {
			const upCandidate = withOffset(coefficients, key, steps[key])
			const upEvaluation = evaluateCoefficients(samples, upCandidate, atmosphere, weights)
			if (upEvaluation.meanWeightedSquaredError < evaluation.meanWeightedSquaredError) {
				coefficients = upCandidate
				evaluation = upEvaluation
				improved = true
				continue
			}

			const downCandidate = withOffset(coefficients, key, -steps[key])
			const downEvaluation = evaluateCoefficients(samples, downCandidate, atmosphere, weights)
			if (downEvaluation.meanWeightedSquaredError < evaluation.meanWeightedSquaredError) {
				coefficients = downCandidate
				evaluation = downEvaluation
				improved = true
			}
		}

		if (improved) {
			recordProgress(progress, options, iteration + 1, coefficients, evaluation)
			continue
		}

		steps = {
			lowSpeedDragCoeff: steps.lowSpeedDragCoeff * 0.5,
			highSpeedDragCoeff: steps.highSpeedDragCoeff * 0.5,
			dragCrisisReynolds: steps.dragCrisisReynolds * 0.5,
			dragCrisisReynoldsWidth: steps.dragCrisisReynoldsWidth * 0.5,
			dragSpinCoeff: steps.dragSpinCoeff * 0.5,
			dragSpinExponent: steps.dragSpinExponent * 0.5,
			liftSpinCoeff: steps.liftSpinCoeff * 0.5,
			liftSpinExponent: steps.liftSpinExponent * 0.5,
			spinDecayPerSecond: steps.spinDecayPerSecond * 0.5
		}

		recordProgress(progress, options, iteration + 1, coefficients, evaluation)

		if (allStepsBelowThreshold(steps, fitKeys, minStepSize)) {
			converged = true
			break
		}
	}

	return {
		coefficients,
		meanWeightedSquaredError: evaluation.meanWeightedSquaredError,
		distanceRmseM: evaluation.distanceRmseM,
		flightTimeRmseS: evaluation.flightTimeRmseS,
		apexRmseM: evaluation.apexRmseM,
		landingAngleRmseDeg: evaluation.landingAngleRmseDeg,
		iterations: iteration + 1,
		converged,
		sampleCount: samples.length,
		sampleFits: evaluation.sampleFits,
		progress
	}
}

export async function fitSimulateTrajectoryToSamplesAsync(
	samples: TrajectoryTrainingSample[],
	options: FitOptions = {}
): Promise<SimulateTrajectoryFitResult> {
	if (samples.length === 0) {
		throw new Error("At least one training sample is required")
	}

	const atmosphere = options.atmosphere ?? defaultAtmosphere
	const weights = {
		distance: options.weights?.distance ?? 5,
		flightTime: options.weights?.flightTime ?? 1,
		apex: options.weights?.apex ?? 1,
		landingAngle: options.weights?.landingAngle ?? 1
	}
	const minStepSize = options.minStepSize ?? 0.001
	const maxIterations = options.maxIterations ?? 40
	const fitKeys = options.fitKeys && options.fitKeys.length > 0 ? options.fitKeys : CoefficientKeys
	const yieldEveryIterations = Math.max(1, options.yieldEveryIterations ?? 1)

	let coefficients = cloneCoefficients(options.initialCoefficients ?? defaultAerodynamicCoefficients)
	let steps: AerodynamicCoefficients = {
		lowSpeedDragCoeff: options.initialSteps?.lowSpeedDragCoeff ?? 0.02,
		highSpeedDragCoeff: options.initialSteps?.highSpeedDragCoeff ?? 0.01,
		dragCrisisReynolds: options.initialSteps?.dragCrisisReynolds ?? 4000,
		dragCrisisReynoldsWidth: options.initialSteps?.dragCrisisReynoldsWidth ?? 1000,
		dragSpinCoeff: options.initialSteps?.dragSpinCoeff ?? 0.15,
		dragSpinExponent: options.initialSteps?.dragSpinExponent ?? 0.08,
		liftSpinCoeff: options.initialSteps?.liftSpinCoeff ?? 0.08,
		liftSpinExponent: options.initialSteps?.liftSpinExponent ?? 0.05,
		spinDecayPerSecond: options.initialSteps?.spinDecayPerSecond ?? 0.005
	}

	let evaluation = evaluateCoefficients(samples, coefficients, atmosphere, weights)
	let converged = false
	let iteration = 0
	const progress: FitProgressPoint[] = []

	recordProgress(progress, options, 0, coefficients, evaluation)
	await yieldToBrowser()

	for (iteration = 0; iteration < maxIterations; iteration++) {
		let improved = false

		for (const key of fitKeys) {
			const upCandidate = withOffset(coefficients, key, steps[key])
			const upEvaluation = evaluateCoefficients(samples, upCandidate, atmosphere, weights)
			if (upEvaluation.meanWeightedSquaredError < evaluation.meanWeightedSquaredError) {
				coefficients = upCandidate
				evaluation = upEvaluation
				improved = true
				continue
			}

			const downCandidate = withOffset(coefficients, key, -steps[key])
			const downEvaluation = evaluateCoefficients(samples, downCandidate, atmosphere, weights)
			if (downEvaluation.meanWeightedSquaredError < evaluation.meanWeightedSquaredError) {
				coefficients = downCandidate
				evaluation = downEvaluation
				improved = true
			}
		}

		if (improved) {
			recordProgress(progress, options, iteration + 1, coefficients, evaluation)
		} else {
			steps = {
				lowSpeedDragCoeff: steps.lowSpeedDragCoeff * 0.5,
				highSpeedDragCoeff: steps.highSpeedDragCoeff * 0.5,
				dragCrisisReynolds: steps.dragCrisisReynolds * 0.5,
				dragCrisisReynoldsWidth: steps.dragCrisisReynoldsWidth * 0.5,
				dragSpinCoeff: steps.dragSpinCoeff * 0.5,
				dragSpinExponent: steps.dragSpinExponent * 0.5,
				liftSpinCoeff: steps.liftSpinCoeff * 0.5,
				liftSpinExponent: steps.liftSpinExponent * 0.5,
				spinDecayPerSecond: steps.spinDecayPerSecond * 0.5
			}

			recordProgress(progress, options, iteration + 1, coefficients, evaluation)

			if (allStepsBelowThreshold(steps, fitKeys, minStepSize)) {
				converged = true
				break
			}
		}

		if ((iteration + 1) % yieldEveryIterations === 0) {
			await yieldToBrowser()
		}
	}

	return {
		coefficients,
		meanWeightedSquaredError: evaluation.meanWeightedSquaredError,
		distanceRmseM: evaluation.distanceRmseM,
		flightTimeRmseS: evaluation.flightTimeRmseS,
		apexRmseM: evaluation.apexRmseM,
		landingAngleRmseDeg: evaluation.landingAngleRmseDeg,
		iterations: iteration + 1,
		converged,
		sampleCount: samples.length,
		sampleFits: evaluation.sampleFits,
		progress
	}
}

function parseFlightScopeRow(row: unknown, index: number): TrajectoryTrainingSample {
	if (typeof row !== "object" || row === null) {
		throw new Error(`Expected object row at index ${index}`)
	}

	const record = row as Partial<FlightScopeRow>
	return {
		launchElevationDeg: parseRequiredNumber(record.LaunchElev, "LaunchElev", index),
		launchSpeedMps: parseRequiredNumber(record.LaunchSpeed, "LaunchSpeed", index),
		backSpinRpm: parseRequiredNumber(record.BackSpin, "BackSpin", index),
		carryDistM: parseRequiredNumber(record.CarryDist, "CarryDist", index),
		flightTimeS: parseRequiredNumber(record.FlightTime, "FlightTime", index),
		apexM: parseRequiredNumber(record.Height, "Height", index),
		landingAngleDeg: parseRequiredNumber(record.ImpactElev, "ImpactElev", index)
	}
}

function parseRequiredNumber(value: unknown, fieldName: string, rowIndex: number): number {
	const numberValue = typeof value === "number" ? value : Number(value)
	if (!Number.isFinite(numberValue)) {
		throw new Error(`Invalid ${fieldName} value at row ${rowIndex}`)
	}
	return numberValue
}

function cloneCoefficients(coefficients: AerodynamicCoefficients): AerodynamicCoefficients {
	return {
		lowSpeedDragCoeff: coefficients.lowSpeedDragCoeff,
		highSpeedDragCoeff: coefficients.highSpeedDragCoeff,
		dragCrisisReynolds: coefficients.dragCrisisReynolds,
		dragCrisisReynoldsWidth: coefficients.dragCrisisReynoldsWidth,
		dragSpinCoeff: coefficients.dragSpinCoeff,
		dragSpinExponent: coefficients.dragSpinExponent,
		liftSpinCoeff: coefficients.liftSpinCoeff,
		liftSpinExponent: coefficients.liftSpinExponent,
		spinDecayPerSecond: coefficients.spinDecayPerSecond
	}
}

function withOffset(
	coefficients: AerodynamicCoefficients,
	key: FitCoefficientKey,
	offset: number
): AerodynamicCoefficients {
	const [lower, upper] = CoefficientBounds[key]
	const candidateValue = clamp(coefficients[key] + offset, lower, upper)
	return {
		...coefficients,
		[key]: candidateValue
	}
}

function allStepsBelowThreshold(
	steps: AerodynamicCoefficients,
	fitKeys: FitCoefficientKey[],
	threshold: number
): boolean {
	return fitKeys.every((key) => {
		if (key === "dragCrisisReynolds") {
			return steps[key] < threshold * 1000
		}
		if (key === "dragCrisisReynoldsWidth") {
			return steps[key] < threshold * 1000
		}
		return steps[key] < threshold
	})
}

function evaluateCoefficients(
	samples: TrajectoryTrainingSample[],
	coefficients: AerodynamicCoefficients,
	atmosphere: Atmosphere,
	weights: FitWeights
): Evaluation {
	const sampleFits: TrainingSampleFit[] = []
	let weightedSquaredErrorSum = 0
	let distanceSquareErrorSum = 0
	let flightTimeSquareErrorSum = 0
	let apexSquareErrorSum = 0
	let landingAngleSquareErrorSum = 0

	for (const sample of samples) {
		const launch: LaunchProperties = {
			speed: sample.launchSpeedMps / MphToMps,
			launchDirection: {
				launchAngle: sample.launchElevationDeg,
				azimuthAngle: 0
			},
			ballSpin: {
				rpm: sample.backSpinRpm,
				axis: 0
			}
		}

		const trajectory = simulateTrajectory(launch, atmosphere, coefficients)
		const stats = traj_stats(trajectory)

		const distanceError = stats.distance - sample.carryDistM
		const flightTimeError = stats.flightTime - sample.flightTimeS
		const apexError = stats.apex - sample.apexM
		const landingAngleError = stats.landingAngle - sample.landingAngleDeg

		const normalizedDistanceError = distanceError / Math.max(Math.abs(sample.carryDistM), MinDenominator)
		const normalizedFlightTimeError = flightTimeError / Math.max(Math.abs(sample.flightTimeS), MinDenominator)
		const normalizedApexError = apexError / Math.max(Math.abs(sample.apexM), MinDenominator)
		const normalizedLandingAngleError = landingAngleError / Math.max(Math.abs(sample.landingAngleDeg), MinDenominator)

		weightedSquaredErrorSum +=
			weights.distance * normalizedDistanceError * normalizedDistanceError +
			weights.flightTime * normalizedFlightTimeError * normalizedFlightTimeError +
			weights.apex * normalizedApexError * normalizedApexError +
			weights.landingAngle * normalizedLandingAngleError * normalizedLandingAngleError

		distanceSquareErrorSum += distanceError * distanceError
		flightTimeSquareErrorSum += flightTimeError * flightTimeError
		apexSquareErrorSum += apexError * apexError
		landingAngleSquareErrorSum += landingAngleError * landingAngleError

		sampleFits.push({
			target: sample,
			stats,
			distanceErrorM: distanceError,
			flightTimeErrorS: flightTimeError,
			apexErrorM: apexError,
			landingAngleErrorDeg: landingAngleError
		})
	}

	const sampleCount = samples.length
	return {
		meanWeightedSquaredError: weightedSquaredErrorSum / sampleCount,
		distanceRmseM: Math.sqrt(distanceSquareErrorSum / sampleCount),
		flightTimeRmseS: Math.sqrt(flightTimeSquareErrorSum / sampleCount),
		apexRmseM: Math.sqrt(apexSquareErrorSum / sampleCount),
		landingAngleRmseDeg: Math.sqrt(landingAngleSquareErrorSum / sampleCount),
		sampleFits
	}
}

function clamp(value: number, minValue: number, maxValue: number): number {
	return Math.min(Math.max(value, minValue), maxValue)
}

function recordProgress(
	progress: FitProgressPoint[],
	options: FitOptions,
	iteration: number,
	coefficients: AerodynamicCoefficients,
	evaluation: Evaluation
): void {
	const point: FitProgressPoint = {
		iteration,
		coefficients: cloneCoefficients(coefficients),
		meanWeightedSquaredError: evaluation.meanWeightedSquaredError,
		distanceRmseM: evaluation.distanceRmseM,
		flightTimeRmseS: evaluation.flightTimeRmseS,
		apexRmseM: evaluation.apexRmseM,
		landingAngleRmseDeg: evaluation.landingAngleRmseDeg
	}
	progress.push(point)
	options.onProgress?.(point)
}

function yieldToBrowser(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, 0)
	})
}
