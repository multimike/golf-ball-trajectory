# Golf Ball Trajectory

Test it here: https://multimike.github.io/golf-ball-trajectory/

A physics-model-based golf ball trajectory simulator built with React, Three.js, and TypeScript.
This project simulates golf ball flight using aerodynamic coefficients and atmospheric conditions.

The model has been fitted to training data produced by Flightscope trajectory optimizer (which correlates very well with Trackman's driver optimizer carry distances).

## Physics Model

The physics model takes into account the following properties when calculating the ball trajectory:
- **Launch Conditions**: Initial velocity, launch angle, and spin rate
- **Aerodynamic Forces**: Drag force accounting for "critical drag" based on Reynolds number and lift forces based on Magnus effect
- **Atmospheric Model**: Uses air temperature, air pressure and relative humidity to calculate air density
- **Wind Model**: Height based wind speed model affecting ball flight trajectory

It simulates the ball flight using fourth-order Runge-Kutta method (**RK4**) for quick and precise numerical integration.

### The math

Three forces affect the ball in flight:
- Gravity: $F_g = mG$
- Drag: $F_d = \frac{1}{2} \rho A C_d v^2$
- Lift force: $F_l = \frac{1}{2} \rho A C_l v^2$

where:
- $m = 0.0459 kg$ is the mass of the ball
- $G = 9.81 m/s^2$ is the gravitational constant
- $A = \pi r^2 $ is the cross-sectional area of the ball
- $r = 0.0213m$ is the radius of the ball
- $v$ is the ball's relative speed through air
- $\rho$ is the density of air (see below)
- $C_d$ is the drag coefficient (see below)
- $C_l$ is the lift coefficient (see below)

#### Air density

Air density is calculated using the ideal gas law for moist air:

$$\rho = \frac{P_{dry}}{R_{dry} \cdot T} + \frac{P_{vapor}}{R_{vapor} \cdot T}$$

where:
- $P_{dry}$ is the partial pressure of dry air (Pa)
- $P_{vapor}$ is the partial pressure of water vapor (Pa)
- $R_{dry} = 287.05$ J/(kg·K) is the specific gas constant for dry air
- $R_{vapor} = 461.495$ J/(kg·K) is the specific gas constant for water vapor
- $T$ is the absolute temperature (Kelvin)

The vapor pressure is calculated using the Alduchov and Eskridge (1996) formula:
$$P_{vapor} = \frac{RH}{100} \cdot 611.2 \cdot \exp\left(\frac{17.27 \cdot T_C}{T_C + 237.3}\right)$$

where:
- $RH$ is the relative humidity (%)
- $T_C$ is the air temperature in Celsius

#### Drag coefficient

The drag coefficient accounts for the "drag crisis" effect caused by golf ball dimples, which causes drag to decrease significantly at higher Reynolds numbers. It is calculated in two steps:

First, the base drag coefficient is interpolated based on Reynolds number using a sigmoid function:

$$C_d^{base} = C_d^{low} \cdot (1 - f) + C_d^{high} \cdot f$$

where:
$$f = \frac{1}{1 + e^{-\frac{Re - Re_{crisis}}{\Delta Re_{crisis}}}}$$

- $C_d^{low} \approx 0.57$ is the drag coefficient at low speeds
- $C_d^{high} \approx 0.20$ is the drag coefficient at high speeds
- $Re$ is the Reynolds number
- $Re_{crisis} \approx 55,000$ is the Reynolds number at which the drag crisis occurs for golf balls
- $\Delta Re_{crisis} \approx 18,000$ is the width of the transition region

Then, the final drag coefficient is adjusted for spin using a power law:

$$C_d = C_d^{base} + C_d^{spin} \cdot s^{n_{spin}}$$

where:
- $s = \frac{\omega r}{v}$ is the spin parameter (dimensionless ratio of surface spin speed to velocity)
- $\omega$ is the angular velocity of the ball (rad/s)
- $C_d^{spin} \approx 0.21$ is the spin-dependent drag coefficient
- $n_{spin} \approx 1.0$ is the spin exponent

#### Lift coefficient

The lift coefficient accounts for the Magnus effect, which creates lift perpendicular to both the spin axis and velocity vector. It is calculated using a power law based on the spin parameter:

$$C_l = C_l^{spin} \cdot s^{n_{spin}}$$

where:
- $s = \frac{\omega r}{v}$ is the spin parameter (dimensionless ratio of surface spin speed to velocity)
- $\omega$ is the angular velocity of the ball (rad/s)
- $C_l^{spin} \approx 0.39$ is the spin-dependent lift coefficient
- $n_{spin} \approx 0.37$ is the spin exponent

The lift force is then directed perpendicular to the relative velocity vector in the plane formed by the spin axis and velocity vector (Magnus effect direction).

## Training

The model has been fitted primarily for **carry distance**, but also for **shot height**, **flight time** and **landing angle**.

Training data is located in `/training-data` and was produced using the Flightscope trajectory optimizer: https://trajectory.flightscope.com/

The training process can be carried out in a separate HTMl page: `http://localhost:5173/fit.html`

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/golf-ball-trajectory.git
cd golf-ball-trajectory
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`
