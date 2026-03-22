import './FormGroup.scss'
import Label from "../label/Label"

type Props = {
    label: string
    small?: string
    children: React.ReactNode
}

export default function FormGroup(props: Props) {
    return (
        <div className="form-group">
            <Label>
                {props.label}
                {props.small && (
                    <>
                        <br />
                        <small>{props.small}</small>
                    </>
                )}
            </Label>
            {props.children}
        </div>
    )
}
