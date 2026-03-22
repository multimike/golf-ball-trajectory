export type AerodynamicCoefficients = {
	lowSpeedDragCoeff: number
	highSpeedDragCoeff: number
	dragCrisisReynolds: number
	dragCrisisReynoldsWidth: number
	dragSpinCoeff: number
	dragSpinExponent: number
	liftSpinCoeff: number
	liftSpinExponent: number
	spinDecayPerSecond: number
}
//
// export const defaultAerodynamicCoefficients: AerodynamicCoefficients = {
//   "lowSpeedDragCoeff": 0.5741503906250011,
//   "highSpeedDragCoeff": 0.18484375000000025,
//   "dragCrisisReynolds": 60310.546875,
//   "dragSpinCoeff": 0.21210937500000115,
//   "dragSpinExponent": 0.7500781250000005,
//   "liftSpinCoeff": 0.4293750000000002,
//   "liftSpinExponent": 0.4218750000000002
// }

export const defaultAerodynamicCoefficients: AerodynamicCoefficients = {
  "lowSpeedDragCoeff": 0.5671484374999327,
  "highSpeedDragCoeff": 0.20309082031250025,
  "dragCrisisReynolds": 55023.4375,
  "dragCrisisReynoldsWidth": 17721.19140625,
  "dragSpinCoeff": 0.20969238281250033,
  "dragSpinExponent": 1.0123437499999999,
  "liftSpinCoeff": 0.3893750000000002,
  "liftSpinExponent": 0.36718749999999994,
  "spinDecayPerSecond": 0.04
}

// export const defaultAerodynamicCoefficients: AerodynamicCoefficients = {
// 	lowSpeedDragCoeff: 0.65,
// 	highSpeedDragCoeff: 0.275,
// 	dragCrisisReynolds: 60000,
// 	dragSpinCoeff: 0.2625000000000011,
// 	dragSpinExponent: 1.0881250000000011,
// 	liftSpinCoeff: 0.4325000000000002,
// 	liftSpinExponent: 0.3968749999999999,
// 	spinDecayPerSecond: 0.04
// }
