export type Vec3 = {
	x: number
	y: number
	z: number
}

export function vec_length(v: Vec3): number {
	return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function vec_lengthSq(v: Vec3): number {
	return v.x * v.x + v.y * v.y + v.z * v.z
}

export function vec_normalize(v: Vec3): Vec3 {
    const length = vec_length(v)
    if (length === 0) {
		return {
			x: 0,
			y: 0,
			z: 0
		}
	}
    return {
		x: v.x / length,
		y: v.y / length,
		z: v.z / length
	}
}

export function vec_cross(a: Vec3, b: Vec3): Vec3 {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	}
}

export function vec_dot(a: Vec3, b: Vec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z
}

export function vec_add(a: Vec3, b: Vec3, c?: Vec3, d?: Vec3): Vec3 {
    if (c && d) {
		return {
			x: a.x + b.x + c.x + d.x,
			y: a.y + b.y + c.y + d.y,
			z: a.z + b.z + c.z + d.z
		}
	} else if (c) {
        return { x: a.x + b.x + c.x, y: a.y + b.y + c.y, z: a.z + b.z + c.z }
    }
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function vec_sub(a: Vec3, b: Vec3): Vec3 {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z
	}
}

export function vec_scale(v: Vec3, s: number): Vec3 {
	return {
		x: v.x * s,
		y: v.y * s,
		z: v.z * s
	}
}

export function vec_distance(a: Vec3, b: Vec3): number {
	return vec_length(vec_sub(a, b))
}