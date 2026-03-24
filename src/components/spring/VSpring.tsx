import React from "react"

type Props = {
	min?: number;
	max?: number;
}

export default function VSpring({ min = 8, max }: Props) {
	const style = {
		flexGrow: 1,
		minHeight: min,
		maxHeight: max,
	} as React.CSSProperties;
    return (
        <div style={style}></div>
    );
}