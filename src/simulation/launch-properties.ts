import {Degrees, Mph, Rpm} from "../util/types.ts"

export type LaunchDirection = {
	launchAngle: Degrees
	azimuthAngle: Degrees
}

export type BallSpin = {
	rpm: Rpm
	axis: Degrees	// Tilt of the spin axis, 0 = no side spin, negative = right to left, positive = left to right
}

export type LaunchProperties = {
	speed: Mph
	launchDirection: LaunchDirection
	ballSpin: BallSpin
}