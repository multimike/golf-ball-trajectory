import Button from '../button/Button'
import './Sidebar.scss'
import {defaultInputs, FormInputs, SpinMode, Units} from "../../util/form-inputs.ts"
import CollapsibleFormGroup from "../form-group/CollapsibleFormGroup.tsx"
import NumberInput from "../number-input/NumberInput.tsx"
import Select from "../select/Select.tsx"
import LinkButton from "../button/LinkButton.tsx"
import {FaGithub} from "react-icons/fa"

type SidebarProps = {
    inputs: FormInputs
    onInputsChange: (next: FormInputs) => void
    onSimulate: () => void
}

const unitOptions = [
    { value: 'meters', label: 'Meters' },
    { value: 'yards', label: 'Yards' }
]

export default function Sidebar({ inputs, onInputsChange, onSimulate }: SidebarProps) {
    const setField = <K extends keyof FormInputs>(key: K, value: FormInputs[K]) => {
        onInputsChange({
            ...inputs,
            [key]: value,
        })
    }

    function restoreAtmosphericDefaults() {
        onInputsChange({
            ...inputs,
            airPressure: defaultInputs.airPressure,
            airTemperature: defaultInputs.airTemperature,
            relativeHumidity: defaultInputs.relativeHumidity,
        })
    }

    return (
        <div className="sidebar">
            <h2>Golf Ball Simulator</h2>

            <Select label="Units" value={inputs.units} options={unitOptions} onChange={value => setField('units', value as Units)} />

            <CollapsibleFormGroup label="Atmosphereic Conditions" initialCollapsed={true}>
                <NumberInput label="Air pressure (hekto-pascal)" value={inputs.airPressure} onChange={value => setField('airPressure', value)} />
                <NumberInput label="Air temperature (°C)" value={inputs.airTemperature} onChange={value => setField('airTemperature', value)} />
                <NumberInput label="Relative humidity (%)" value={inputs.relativeHumidity} onChange={value => setField('relativeHumidity', value)} />
                <Button onClick={restoreAtmosphericDefaults} variant="outline">Restore defaults</Button>
            </CollapsibleFormGroup>

            <CollapsibleFormGroup label="Wind Conditions" initialCollapsed={true}>
                <NumberInput label="Wind speed (m/s)" value={inputs.windSpeed} onChange={value => setField('windSpeed', value)} />
                <NumberInput label="Wind direction (°, 0 = tailwind)" value={inputs.windDirection} onChange={value => setField('windDirection', value)} />
            </CollapsibleFormGroup>

            <CollapsibleFormGroup label="Launch properties">
                <NumberInput label="Ball speed (mph)" value={inputs.speed} onChange={value => setField('speed', value)} />
                <NumberInput label="Launch angle (°)" value={inputs.launch} onChange={value => setField('launch', value)} />
                <NumberInput label="Launch direction / Azimuth (°)" value={inputs.azimuth} onChange={value => setField('azimuth', value)} />
                <Select label="Spin input mode" value={inputs.spinMode} options={[
                    { value: 'total_axis', label: 'Total spin & axis' },
                    { value: 'back_side', label: 'Backspin & sidespin' },
                ]} onChange={value => setField('spinMode', value as SpinMode)} />
                {inputs.spinMode === 'total_axis' ? <>
                    <NumberInput label="Spin rate (rpm)" value={inputs.spin} onChange={value => setField('spin', value)} />
                    <NumberInput label="Spin axis tilt (°)" value={inputs.axis} onChange={value => setField('axis', value)} />
                </> : <>
                    <NumberInput label="Backspin (rpm)" value={inputs.backspin} onChange={value => setField('backspin', value)} />
                    <NumberInput label="Sidespin (rpm)" value={inputs.sidespin} onChange={value => setField('sidespin', value)} />
                </>}
            </CollapsibleFormGroup>

            <Button onClick={onSimulate}>Simulate Shot</Button>

            <LinkButton variant="outline" href="https://github.com/multimike/golf-ball-trajectory" style={{ marginTop: 20 }}>
                <FaGithub /> View on GitHub
            </LinkButton>

        </div>
    )
}
