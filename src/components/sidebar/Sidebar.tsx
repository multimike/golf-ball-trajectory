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
            <a href="https://github.com/multimike/golf-ball-trajectory" className="github-link">
                <svg className="github-icon" width="32" height="32" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.356 1.85C5.05 1.85 1.57 5.356 1.57 9.694a7.84 7.84 0 0 0 5.324 7.44c.387.079.528-.168.528-.376 0-.182-.013-.805-.013-1.454-2.165.467-2.616-.935-2.616-.935-.349-.91-.864-1.143-.864-1.143-.71-.48.051-.48.051-.48.787.051 1.2.805 1.2.805.695 1.194 1.817.857 2.268.649.064-.507.27-.857.49-1.052-1.728-.182-3.545-.857-3.545-3.87 0-.857.31-1.558.8-2.104-.078-.195-.349-1 .077-2.078 0 0 .657-.208 2.14.805a7.5 7.5 0 0 1 1.946-.26c.657 0 1.328.092 1.946.26 1.483-1.013 2.14-.805 2.14-.805.426 1.078.155 1.883.078 2.078.502.546.799 1.247.799 2.104 0 3.013-1.818 3.675-3.558 3.87.284.247.528.714.528 1.454 0 1.052-.012 1.896-.012 2.156 0 .208.142.455.528.377a7.84 7.84 0 0 0 5.324-7.441c.013-4.338-3.48-7.844-7.773-7.844" fill="currentColor"/>
                </svg>
                View on GitHub
            </a>
        </div>
    )
}
