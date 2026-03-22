import type { ChangeEvent } from 'react'
import Button from '../button/Button'
import FormGroup from '../form-group/FormGroup'
import './Sidebar.scss'
import {FormInputs, SpinMode, Units} from "../../util/form-inputs.ts"

type SidebarProps = {
    inputs: FormInputs
    onInputsChange: (next: FormInputs) => void
    onSimulate: () => void
}

function toNumber(event: ChangeEvent<HTMLInputElement>) {
    return Number.parseFloat(event.target.value)
}

export default function Sidebar({ inputs, onInputsChange, onSimulate }: SidebarProps) {
    const setField = <K extends keyof FormInputs>(key: K, value: FormInputs[K]) => {
        onInputsChange({
            ...inputs,
            [key]: value,
        })
    }

    return (
        <div className="sidebar">
            <h2>Golf Ball Simulator</h2>

            <FormGroup label="Units">
                <select
                    value={inputs.units}
                    onChange={(event) => setField('units', event.target.value as Units)}
                >
                    <option value="yards">Yards</option>
                    <option value="meters">Meters</option>
                </select>
            </FormGroup>

            <FormGroup label="Ball Speed (mph)">
                <input
                    type="number"
                    value={inputs.speed}
                    step={1}
                    min={10}
                    max={250}
                    onChange={(event) => setField('speed', toNumber(event))}
                />
            </FormGroup>
            <FormGroup label="Launch Angle (deg)">
                <input
                    type="number"
                    value={inputs.launch}
                    step={0.5}
                    min={-10}
                    max={80}
                    onChange={(event) => setField('launch', toNumber(event))}
                />
            </FormGroup>
            <FormGroup label="Launch Direction / Azimuth (deg)" small="(- Left / + Right)">
                <input
                    type="number"
                    value={inputs.azimuth}
                    step={1}
                    min={-90}
                    max={90}
                    onChange={(event) => setField('azimuth', toNumber(event))}
                />
            </FormGroup>

            <FormGroup label="Spin Input Mode">
                <select
                    value={inputs.spinMode}
                    onChange={(event) => setField('spinMode', event.target.value as SpinMode)}
                >
                    <option value="total_axis">Total Spin & Axis</option>
                    <option value="back_side">Backspin & Sidespin</option>
                </select>
            </FormGroup>

            {inputs.spinMode === 'total_axis' ? (
                <div>
                    <FormGroup label="Total Spin Rate (rpm)">
                        <input
                            type="number"
                            value={inputs.spin}
                            step={100}
                            min={0}
                            max={12000}
                            onChange={(event) => setField('spin', toNumber(event))}
                        />
                    </FormGroup>
                    <FormGroup label="Spin Axis Tilt (deg)" small="(- Draw(L) / + Fade(R))">
                        <input
                            type="number"
                            value={inputs.axis}
                            step={1}
                            min={-90}
                            max={90}
                            onChange={(event) => setField('axis', toNumber(event))}
                        />
                    </FormGroup>
                </div>
            ) : (
                <div>
                    <FormGroup label="Backspin (rpm)">
                        <input
                            type="number"
                            value={inputs.backspin}
                            step={100}
                            min={0}
                            max={12000}
                            onChange={(event) => setField('backspin', toNumber(event))}
                        />
                    </FormGroup>
                    <FormGroup label="Sidespin (rpm)" small="(- Draw(L) / + Fade(R))">
                        <input
                            type="number"
                            value={inputs.sidespin}
                            step={100}
                            min={-5000}
                            max={5000}
                            onChange={(event) => setField('sidespin', toNumber(event))}
                        />
                    </FormGroup>
                </div>
            )}

            <Button onClick={onSimulate}>Simulate Shot</Button>

        </div>
    )
}
