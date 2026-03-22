import {Degrees, Mps} from "../util/types.ts"

export type Atmosphere = {
	windSpeed: Mps
	windDirection: Degrees
	airTemperatureC: number
	airPressure: number
	relativeHumidity: number
}

export const defaultAtmosphere: Atmosphere = {
    windSpeed: 0,
    windDirection: 0,
    airTemperatureC: 25,
    airPressure: 101325,
    relativeHumidity: 50,
}
