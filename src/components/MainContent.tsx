import {useEffect, useMemo, useRef} from 'react'
import {Chart} from 'chart.js/auto'
import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {Line, OrbitControls, Text} from '@react-three/drei'
import type {OrbitControls as OrbitControlsType} from 'three-stdlib'
import type {Mesh} from 'three'
import * as THREE from 'three'
import {BallTrajectory, traj_stats} from "../simulation/trajectory.ts"

type MainContentProps = {
	trajectory: BallTrajectory
	unitLabel: string
	unitMultiplier: number
}

type Stats = {
	carry: number
	maxHeight: number
	offline: number
	flightTime: number
	landingAngle: number
}

function buildStats(trajectory: BallTrajectory, unitMultiplier: number): Stats {
	const stats = traj_stats(trajectory)
	return {
		carry: stats.distance * unitMultiplier,
		maxHeight: stats.apex * unitMultiplier,
		offline: stats.lateral * unitMultiplier,
		flightTime: stats.flightTime,
		landingAngle: stats.landingAngle,
	}
}

function DrivingRangeScene({ trajectory, unitMultiplier }: { trajectory: BallTrajectory; unitMultiplier: number }) {
	const controlsRef = useRef<OrbitControlsType>(null)
	const ballRef = useRef<Mesh>(null)
	const shadowRef = useRef<Mesh>(null)
	const frameIndexRef = useRef(0)
	const { camera } = useThree()

	const trajectoryPoints = useMemo(
		() => trajectory.map((ballState) => new THREE.Vector3(ballState.position.z, ballState.position.y, -ballState.position.x)),
		[trajectory]
	)

	const trees = useMemo(
		() => {
			const trees = []
			for(let i = 0; i < 250; i++) {
				const x = Math.random() * 300 - 150
				const z = -Math.random() * 500
				const height = 18 + Math.random() * 7
				const trunkHeight = height * 0.25
				const leavesHeight = height * 0.75
				if(z < -350 || Math.abs(x) > 50) {
					trees.push({ x, z, height, trunkHeight, leavesHeight })
				}
			}
			return trees
		},
		[]
	)

	const markers = useMemo(() => {
		const items: { distance: number; zPos: number }[] = []
		for (let distance = 50; distance <= 350; distance += 50) {
			items.push({ distance, zPos: -(distance / unitMultiplier) })
		}
		return items
	}, [unitMultiplier])

	useEffect(() => {
		frameIndexRef.current = 0
		controlsRef.current?.target.set(0, 2, -50)
		controlsRef.current?.update()
	}, [camera, trajectoryPoints])

	useFrame(() => {
		if (trajectoryPoints.length === 0) {
			return
		}

		const safeIndex = Math.min(frameIndexRef.current, trajectoryPoints.length - 1)
		const currentPos = trajectoryPoints[safeIndex]

		if (ballRef.current) {
			ballRef.current.position.copy(currentPos)
		}
		if (shadowRef.current) {
			shadowRef.current.position.set(currentPos.x, 0.05, currentPos.z)
		}
		if (currentPos.z < -20 && controlsRef.current) {
			controlsRef.current.target.z = currentPos.z - 30
			controlsRef.current.target.x = currentPos.x
		}

		const animationStep = Math.max(1, Math.floor(trajectoryPoints.length / 150))
		frameIndexRef.current = Math.min(frameIndexRef.current + animationStep, trajectoryPoints.length - 1)
	})

	return (
		<>
			<color attach="background" args={['#b1def1']} />
			<fog attach="fog" args={['#b1def1', 50, 800]} />

			<ambientLight intensity={1.8} />
			<directionalLight
				intensity={3.6}
				position={[150, 200, 50]}
				castShadow
				shadow-camera-top={200}
				shadow-camera-bottom={-200}
				shadow-camera-left={-200}
				shadow-camera-right={200}
				shadow-bias={-0.001}
			/>

			<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -400]}>
				<planeGeometry args={[1000, 1000]} />
				<meshLambertMaterial color="#2d6a4f" />
			</mesh>

			<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
				<planeGeometry args={[20, 10]} />
				<meshLambertMaterial color="#1b4332" />
			</mesh>

			<mesh ref={ballRef} castShadow>
				<sphereGeometry args={[0.5, 16, 16]} />
				<meshStandardMaterial color="#ffffff" roughness={0.2} />
			</mesh>

			<mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.5, 16]} />
				<meshBasicMaterial color="#000000" transparent opacity={0.4} />
			</mesh>

			<group>
				{trees.map((tree, index) => (
					<group key={index}>
						<mesh castShadow receiveShadow position={[tree.x, tree.trunkHeight / 2, tree.z]}>
							<cylinderGeometry args={[0.6, 1, tree.trunkHeight, 7]} />
							<meshLambertMaterial color="#4a3b2c" />
						</mesh>
						<mesh castShadow receiveShadow position={[tree.x, tree.trunkHeight + tree.leavesHeight / 2, tree.z]}>
							<coneGeometry args={[tree.height * 0.22, tree.leavesHeight, 7]} />
							<meshLambertMaterial color="#1e5631" />
						</mesh>
					</group>
				))}
			</group>

			<group>
				{markers.map((marker) => (
					<group key={marker.distance}>
						<Line
							points={[
								[-100, 0.05, marker.zPos],
								[100, 0.05, marker.zPos],
							]}
							color="#ffffff"
							transparent
							opacity={0.3}
							lineWidth={1}
						/>
						<Text position={[-30, 3.5, marker.zPos]} rotation={[0, Math.PI / 5, 0]} color="#ffffff" fontWeight="bold" fontSize={7}>
							{String(marker.distance)}
						</Text>
						<Text position={[30, 3.5, marker.zPos]} rotation={[0, -Math.PI / 5, 0]} color="#ffffff" fontWeight="bold" fontSize={7}>
							{String(marker.distance)}
						</Text>
					</group>
				))}
			</group>

			{trajectoryPoints.length > 0 && (
				<Line
					points={trajectoryPoints.map((point) => [point.x, point.y, point.z])}
					color="#ffd700"
					lineWidth={2}
				/>
			)}

			<OrbitControls ref={controlsRef} maxPolarAngle={Math.PI / 2 - 0.01} />
		</>
	)
}

export default function MainContent({ trajectory, unitLabel, unitMultiplier }: MainContentProps) {
	const chartCanvasRef = useRef<HTMLCanvasElement>(null)
	const stats = useMemo(() => buildStats(trajectory, unitMultiplier), [trajectory, unitMultiplier])

	useEffect(() => {
		const canvas = chartCanvasRef.current
		if (!canvas || trajectory.length === 0) {
			return
		}

		// every 10:th point is more than enough
		const chartData = []
		for(let i = 0; i < trajectory.length; i += 10) {
			chartData.push({
				x: trajectory[i].position.x * unitMultiplier,
				y: trajectory[i].position.y * unitMultiplier,
			})
		}
		const lastPoint = trajectory[trajectory.length - 1]
		chartData.push({
				x: lastPoint.position.x * unitMultiplier,
				y: lastPoint.position.y * unitMultiplier,
			})
		// const chartData = trajectory.map(ballState => ({
		// 	x: ballState.position.x * unitMultiplier,
		// 	y: ballState.position.y * unitMultiplier,
		// }))

		const chart = new Chart(canvas, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label: 'Trajectory Height',
						data: chartData,
						borderColor: '#28a745',
						backgroundColor: 'rgba(40, 167, 69, 0.2)',
						showLine: true,
						pointRadius: 0,
						borderWidth: 3,
						fill: true,
						animation: false
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: {
						type: 'linear',
						position: 'bottom',
						title: {
							display: true,
							text: `Distance (${unitLabel})`,
							font: { weight: 'bold' },
						},
						min: 0,
						max: Math.ceil((chartData[chartData.length - 1].x + 20) / 50) * 50,
					},
					y: {
						title: {
							display: true,
							text: `Height (${unitLabel})`,
							font: { weight: 'bold' },
						},
						min: 0,
						max: Math.max(80, Math.ceil(Math.max(...chartData.map((point) => point.y)) + 10)),
					},
				},
			},
		})

		return () => {
			chart.destroy()
		}
	}, [trajectory, unitLabel, unitMultiplier])

	return (
		<div className="main-content">
			<div className="panel">
				<div className="stats">
					<div>Carry: <span>{stats.carry.toFixed(1)}</span> <span className="unit-label">{unitLabel}</span></div>
					<div>Max Height: <span>{stats.maxHeight.toFixed(1)}</span> <span className="unit-label">{unitLabel}</span></div>
					<div>Offline: <span>{stats.offline.toFixed(1)}</span> <span className="unit-label">{unitLabel}</span></div>
					<div>Flight time: <span>{stats.flightTime.toFixed(1)}</span> <span className="unit-label">s</span></div>
					<div>Landing angle: <span>{stats.landingAngle.toFixed(1)}</span> <span className="unit-label">deg</span></div>
				</div>
				<div className="chart-container">
					<canvas ref={chartCanvasRef} />
				</div>
			</div>

			<div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<h3>3D Driving Range View</h3>
				<div id="canvas-container">
					<Canvas
						shadows
						camera={{ fov: 55, near: 0.1, far: 1000, position: [0, 6, 15] }}
						gl={{ antialias: true }}
					>
						<DrivingRangeScene trajectory={trajectory} unitMultiplier={unitMultiplier} />
					</Canvas>
				</div>
			</div>
		</div>
	)
}
