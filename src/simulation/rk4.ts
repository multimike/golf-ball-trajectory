export function rk4Step<State, Derivative>(
	state: State,
	dt: number,
	getDerivative: (state: State) => Derivative,
	addScaledDerivativeToState: (state: State, derivative: Derivative, scale: number) => State,
	scaleDerivative: (derivative: Derivative, scale: number) => Derivative,
	addDerivatives: (a: Derivative, b: Derivative, c: Derivative, d: Derivative) => Derivative
): State {
	const k1 = getDerivative(state)
	const k2 = getDerivative(addScaledDerivativeToState(state, k1, dt / 2))
	const k3 = getDerivative(addScaledDerivativeToState(state, k2, dt / 2))
	const k4 = getDerivative(addScaledDerivativeToState(state, k3, dt))

	const weightedDerivative = addDerivatives(
		k1,
		scaleDerivative(k2, 2),
		scaleDerivative(k3, 2),
		k4
	)

	return addScaledDerivativeToState(state, scaleDerivative(weightedDerivative, 1/6), dt)
}
