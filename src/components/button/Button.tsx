import {ReactNode} from "react"
import './Button.scss'

type Props = {
	children: ReactNode
    onClick?: () => void
}

export default function Button(props: Props) {
	return (
		<button onClick={props.onClick}>{props.children}</button>
	)
}
