import {Degrees, Mph, Mps, Rpm} from "./types.ts"
import {BallSpin} from "../simulation/launch-properties.ts"

export type Units = 'yards' | 'meters'
export type SpinMode = 'total_axis' | 'back_side'

export type FormInputs = {
	units: Units
	airTemperature: number
	airPressure: number
	relativeHumidity: number
	windSpeed: Mps
	windDirection: Degrees
	speed: Mph
	launch: Degrees
	azimuth: Degrees
	spinMode: SpinMode
	spin: Rpm
	axis: Degrees
	backspin: Rpm
	sidespin: Rpm
}

// 252.4 yard carry, 27,7 yard apex (Flightscope)
export const defaultInputs: FormInputs = {
	airPressure: 1013,
	airTemperature: 25,
	relativeHumidity: 50,
	windSpeed: 0,
	windDirection: 0,
	units: 'yards',
	speed: 146,
	launch: 12.1,
	azimuth: 0,
	spinMode: 'total_axis',
	spin: 3118,
	axis: 0,
	backspin: 3118,
	sidespin: 0,
}

export function getBallSpin(inputs: FormInputs): BallSpin {
    if (inputs.spinMode === 'total_axis') {
        return {
            rpm: inputs.spin,
            axis: inputs.axis,
        }
    }

    const rpm = Math.hypot(inputs.backspin, inputs.sidespin)
    const axis = Math.atan2(inputs.sidespin, inputs.backspin) * (180 / Math.PI)
    return { rpm, axis }
}