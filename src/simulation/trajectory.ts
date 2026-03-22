import {Vec3} from "../util/vec3.ts"
import {Degrees} from "../util/types.ts"

export type BallState = {
	position: Vec3
	velocity: Vec3
	spin: Vec3
	timeS: number
}

export type BallTrajectory = BallState[]

export type BallTrajectoryStats = {
	apex: number
	flightTime: number
	distance: number
	lateral: number
	landingAngle: Degrees
}

export function traj_stats(trajectory: BallTrajectory): BallTrajectoryStats {
    if (trajectory.length === 0) {
        return { apex: 0, flightTime: 0, distance: 0, lateral: 0, landingAngle: 0 }
    }
	return {
		apex: traj_apex(trajectory),
		flightTime: traj_flightTime(trajectory),
		distance: traj_distance(trajectory),
		lateral: traj_lateral(trajectory),
		landingAngle: traj_landingAngle(trajectory),
	}
}

function traj_apex(trajectory: BallTrajectory): number {
	return Math.max(...trajectory.map((ballState) => ballState.position.y))
}

function traj_flightTime(trajectory: BallTrajectory): number {
	return trajectory[trajectory.length - 1].timeS
}

function traj_distance(trajectory: BallTrajectory): number {
	return trajectory[trajectory.length - 1].position.x
}

function traj_lateral(trajectory: BallTrajectory): number {
	return trajectory[trajectory.length - 1].position.z
}

function traj_landingAngle(trajectory: BallTrajectory): number {
	return Math.atan2(trajectory[trajectory.length - 1].velocity.y, trajectory[trajectory.length - 1].velocity.x) * (180 / Math.PI)
}
