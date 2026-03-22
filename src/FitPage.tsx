import {useEffect, useRef, useState} from "react"
import Chart from "chart.js/auto"
import type {Chart as ChartJS} from "chart.js"
import {
	FitCoefficientKey,
	FitProgressPoint,
	SimulateTrajectoryFitResult,
	fitSimulateTrajectoryToTrainingJsonAsync,
	getDefaultFitCoefficientKeys
} from "./training/fit-simulate-trajectory.ts"

const TrainingDataUrls = [
	// "/training-data/flightscope/foresight-driver.json",
	"/training-data/flightscope/tour-avg-men.json",
	"/training-data/flightscope/tour-avg-women.json",
	"/training-data/flightscope/wedges.json",
	"/training-data/flightscope/trackman-driver-optimizer.json"
]

const FitKeyLabels: Record<FitCoefficientKey, string> = {
	lowSpeedDragCoeff: "Low-speed drag coeff",
	highSpeedDragCoeff: "High-speed drag coeff",
	dragCrisisReynolds: "Drag crisis Reynolds",
	dragCrisisReynoldsWidth: "Drag crisis Reynolds width",
	dragSpinCoeff: "Drag spin coeff",
	dragSpinExponent: "Drag spin exponent",
	liftSpinCoeff: "Lift spin coeff",
	liftSpinExponent: "Lift spin exponent",
	spinDecayPerSecond: "Spin decay / second"
}

export function FitPage() {
	const chartCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const chartRef = useRef<ChartJS | null>(null)

	const [running, setRunning] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [progress, setProgress] = useState<FitProgressPoint[]>([])
	const [result, setResult] = useState<SimulateTrajectoryFitResult | null>(null)
	const [selectedFitKeys, setSelectedFitKeys] = useState<FitCoefficientKey[]>(() => getDefaultFitCoefficientKeys())

	useEffect(() => {
		const canvas = chartCanvasRef.current
		if (!canvas) {
			return
		}

		if (chartRef.current) {
			return
		}

		chartRef.current = new Chart(canvas, {
			type: "line",
			data: {
				labels: [],
				datasets: [
					{
						label: "Mean Weighted Squared Error",
						data: [],
						borderColor: "#124e78",
						backgroundColor: "rgba(18,78,120,0.2)",
						tension: 0.2,
						pointRadius: 0
					},
					{
						label: "Distance RMSE (m)",
						data: [],
						borderColor: "#f0a202",
						backgroundColor: "rgba(240,162,2,0.2)",
						tension: 0.2,
						pointRadius: 0
					},
					{
						label: "Apex RMSE (m)",
						data: [],
						borderColor: "#2a9d8f",
						backgroundColor: "rgba(42,157,143,0.2)",
						tension: 0.2,
						pointRadius: 0
					},
					{
						label: "Flight-time RMSE (s)",
						data: [],
						borderColor: "#8c564b",
						backgroundColor: "rgba(140,86,75,0.2)",
						tension: 0.2,
						pointRadius: 0
					},
					{
						label: "Landing-angle RMSE (deg)",
						data: [],
						borderColor: "#6f42c1",
						backgroundColor: "rgba(111,66,193,0.2)",
						tension: 0.2,
						pointRadius: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: {
					legend: {
						position: "bottom"
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: "Iteration"
						}
					},
					y: {
						title: {
							display: true,
							text: "Error"
						}
					}
				}
			}
		})

		return () => {
			chartRef.current?.destroy()
			chartRef.current = null
		}
	}, [])

	useEffect(() => {
		const chart = chartRef.current
		if (!chart) {
			return
		}

		chart.data.labels = progress.map((point) => point.iteration)
		chart.data.datasets[0].data = progress.map((point) => point.meanWeightedSquaredError)
		chart.data.datasets[1].data = progress.map((point) => point.distanceRmseM)
		chart.data.datasets[2].data = progress.map((point) => point.apexRmseM)
		chart.data.datasets[3].data = progress.map((point) => point.flightTimeRmseS)
		chart.data.datasets[4].data = progress.map((point) => point.landingAngleRmseDeg)
		chart.update("none")
	}, [progress])

	const startFitting = async () => {
		if (selectedFitKeys.length === 0) {
			setError("Select at least one aerodynamic parameter to fit.")
			return
		}

		setRunning(true)
		setError(null)
		setProgress([])
		setResult(null)

		try {
			const responses = await Promise.all(
				TrainingDataUrls.map((url) => fetch(url))
			)

			for (let i = 0; i < responses.length; i++) {
				const response = responses[i]
				if (!response.ok) {
					throw new Error(
						`Could not load training data (${TrainingDataUrls[i]}): ${response.status} ${response.statusText}`
					)
				}
			}
			const jsonTexts = await Promise.all(responses.map((response) => response.text()))

			const fitResult = await fitSimulateTrajectoryToTrainingJsonAsync(
				jsonTexts,
				{
					maxIterations: 1000,
					yieldEveryIterations: 1,
					fitKeys: selectedFitKeys,
					weights: {
						distance: 100,
						flightTime: 1,
						apex: 5,
						landingAngle: 1
					},
					onProgress: (point) => {
						setProgress((previousProgress) => [...previousProgress, point])
					}
				}
			)

			setResult(fitResult)
		} catch (caughtError) {
			setError(caughtError instanceof Error ? caughtError.message : "Failed to run fitting")
		} finally {
			setRunning(false)
		}
	}

	const toggleFitKey = (key: FitCoefficientKey) => {
		setSelectedFitKeys((previousKeys) => {
			if (previousKeys.includes(key)) {
				return previousKeys.filter((previousKey) => previousKey !== key)
			}
			return [...previousKeys, key]
		})
	}

	return (
		<div className="fit-page">
			<header className="fit-header">
				<h1>Trajectory Fitting</h1>
				<p>Fits simulateTrajectory to Flightscope training data using carry, flight time, apex, and landing angle.</p>
				<div className="fit-options">
					<p>Parameters to fit:</p>
					<div className="fit-checkbox-grid">
						{getDefaultFitCoefficientKeys().map((fitKey) => (
							<label key={fitKey}>
								<input
									type="checkbox"
									checked={selectedFitKeys.includes(fitKey)}
									onChange={() => toggleFitKey(fitKey)}
									disabled={running}
								/>
								<span>{FitKeyLabels[fitKey]}</span>
							</label>
						))}
					</div>
				</div>
				<button className="fit-button" onClick={startFitting} disabled={running}>
					{running ? "Fitting..." : "Run Fitting"}
				</button>
			</header>

			{error && <p className="fit-error">{error}</p>}

			<section className="fit-card">
				<h2>Progress</h2>
				<div className="fit-chart-wrap">
					<canvas ref={chartCanvasRef} />
				</div>
			</section>

			{result && (
				<section className="fit-card">
					<h2>Final Result</h2>
					<div className="fit-grid">
						<div>
							<h3>Coefficients</h3>
							<pre>{JSON.stringify(result.coefficients, null, 2)}</pre>
						</div>
						<div>
							<h3>Metrics</h3>
							<ul>
								<li>Samples: {result.sampleCount}</li>
								<li>Iterations: {result.iterations}</li>
								<li>Converged: {String(result.converged)}</li>
								<li>Mean weighted squared error: {result.meanWeightedSquaredError.toFixed(6)}</li>
								<li>Distance RMSE: {result.distanceRmseM.toFixed(3)} m</li>
								<li>Flight-time RMSE: {result.flightTimeRmseS.toFixed(3)} s</li>
								<li>Apex RMSE: {result.apexRmseM.toFixed(3)} m</li>
								<li>Landing-angle RMSE: {result.landingAngleRmseDeg.toFixed(3)} deg</li>
							</ul>
						</div>
					</div>
				</section>
			)}
		</div>
	)
}
