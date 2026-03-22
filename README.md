# Golf Ball Trajectory

A physics-based golf ball trajectory simulator built with React, Three.js, and TypeScript. This project simulates realistic golf ball flight using aerodynamic coefficients and atmospheric conditions.

## Features

- **Realistic Physics Simulation**: Uses RK4 integration for accurate trajectory calculation
- **Interactive Visualization**: 3D visualization of ball flight using Three.js
- **Aerodynamic Modeling**: Implements drag and lift coefficients based on golf ball physics
- **Atmospheric Conditions**: Accounts for air density and environmental factors
- **Club Fitting**: Analyze and optimize launch properties for different golf clubs
- **Training Data**: Includes real-world launch data from Foresight and Trackman systems

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Visualization**: Three.js, @react-three/fiber, @react-three/drei
- **Charts**: Chart.js
- **Styling**: SCSS
- **Build**: Vite
- **Linting**: ESLint

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── button/
│   ├── form-group/
│   ├── label/
│   └── sidebar/
├── simulation/          # Physics engine
│   ├── aerodynamic-coefficients.ts
│   ├── atmosphere.ts
│   ├── launch-properties.ts
│   ├── rk4.ts
│   ├── simulation.ts
│   └── trajectory.ts
├── training/           # Training data processing
├── util/               # Utility functions
└── App.tsx            # Main application

public/                # Static assets
training-data/         # Golf launch data (CSV, JSON)
test/                  # Test HTML files
```

## Physics Model

The simulator uses:
- **RK4 Integration**: Fourth-order Runge-Kutta method for accurate trajectory calculation
- **Aerodynamic Forces**: Drag and lift forces based on Magnus effect
- **Atmospheric Model**: Air density based on altitude and temperature
- **Launch Conditions**: Initial velocity, launch angle, and spin rate

## Training Data

The project includes launch data from professional golf:
- Foresight driver data
- Tour average data (men's and women's)
- Trackman driver optimizer data
- Wedge data

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Created for golf ball trajectory analysis and club fitting optimization.

