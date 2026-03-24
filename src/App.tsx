import {useMemo, useState} from 'react'
import MainContent from './components/MainContent'
import Sidebar from './components/sidebar/Sidebar'
import {defaultInputs, FormInputs, getBallSpin} from "./util/form-inputs.ts"
import {BallState} from "./simulation/trajectory.ts"
import {simulateTrajectory} from "./simulation/simulation.ts"
import {Atmosphere} from "./simulation/atmosphere.ts"

function getAtmosphereFromInputs(inputs: FormInputs): Atmosphere {
    return {
        windSpeed: inputs.windSpeed,
        windDirection: inputs.windDirection,
        airTemperatureC: inputs.airTemperature,
        airPressure: inputs.airPressure * 100, // Convert from hekto-pascals to pascals
        relativeHumidity: inputs.relativeHumidity,
    }
}

export default function App() {
    const [inputs, setInputs] = useState<FormInputs>(defaultInputs)
    const [trajectory, setTrajectory] = useState<BallState[]>(() => {
        const ballSpin = getBallSpin(defaultInputs)
        const launchProperties = {
            speed: defaultInputs.speed,
            launchDirection: {
                launchAngle: defaultInputs.launch,
                azimuthAngle: defaultInputs.azimuth,
            },
            ballSpin
        }
        const atmosphere = getAtmosphereFromInputs(defaultInputs)
        return simulateTrajectory(launchProperties, atmosphere)
    })

    const unitSettings = useMemo(() => {
        if (inputs.units === 'yards') {
            return { multiplier: 1.09361, label: 'yds' }
        }
        return { multiplier: 1, label: 'm' }
    }, [inputs.units])

    const runSimulation = () => {
        const ballSpin = getBallSpin(inputs)
        const launchProperties = {
            speed: inputs.speed,
            launchDirection: {
                launchAngle: inputs.launch,
                azimuthAngle: inputs.azimuth,
            },
            ballSpin
        }
        const atmosphere = getAtmosphereFromInputs(inputs)
        const nextTrajectory = simulateTrajectory(launchProperties, atmosphere)
        setTrajectory(nextTrajectory)
    }

    return (
        <>
            <Sidebar
                inputs={inputs}
                onInputsChange={setInputs}
                onSimulate={runSimulation}
            />
            <MainContent
                trajectory={trajectory}
                unitLabel={unitSettings.label}
                unitMultiplier={unitSettings.multiplier}
            />
        </>
    )
}
