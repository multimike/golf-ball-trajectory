# Golf Ball Trajectory

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
