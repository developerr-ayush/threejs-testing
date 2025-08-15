# F1 Visualizer

A Three.js-based Formula 1 race visualization system with realistic physics, multiple camera modes, and telemetry display.

![F1 Visualizer](https://github.com/developerr-ayush/threejs-testing/raw/main/temp/01%20when%20page%20loads.png)

## Features

- **Interactive 3D Environment**: Fully interactive race track and F1 cars using Three.js
- **Multiple Camera Perspectives**: F1-style camera modes including T-cam, chase view, and front wing camera
- **Realistic Car Physics**: Acceleration, braking, and steering with F1-like handling characteristics
- **Real-time Telemetry**: HUD displaying speed, RPM, gear, and more
- **Customizable Controls**: Keyboard controls for driving and camera management

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. Clone the repository:

```bash
git clone https://github.com/developerr-ayush/threejs-testing.git
cd threejs-testing
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

## Controls

### Car Controls

- **W/S**: Accelerate/Brake
- **A/D**: Steer left/right
- **Shift+A/D**: Strafe left/right

### Camera Controls

- **C**: Cycle through camera modes (Top, Chase, Bottom, T-Cam, Front Wing)
- **H**: Toggle HUD display

### GUI Controls

- **Camera**: Switch between follow camera and helper camera
- **Manual Controls**: Adjust car positions manually
- **Race Controls**: Configure race mode parameters
- **Car 1 Utils**: Reset car position and other utilities
- **Capture**: Copy current coordinates for debugging

## Documentation

Detailed documentation is available in the `Docs` folder:

- [Project Structure](./Docs/project_structure.md): Overview of the codebase organization
- [Implementation Guide](./Docs/Implementation.md): Implementation stages and progress
- [Bug Tracking](./Docs/Bug_tracking.md): Known issues and resolutions
- [UI/UX Documentation](./Docs/UI_UX_doc.md): Interface design and user experience
- [Development Guide](./Docs/Development_Guide.md): Guidelines for contributors

## Technologies Used

- [Three.js](https://threejs.org/): 3D rendering
- [Cannon.js](https://schteppe.github.io/cannon.js/): Physics simulation
- [lil-gui](https://lil-gui.georgealways.com/): GUI controls
- [Vite](https://vitejs.dev/): Development server and build tool

## Project Status

This project is under active development. See the [Implementation Guide](./Docs/Implementation.md) for current progress and planned features.

## Contributing

Contributions are welcome! Please see the [Development Guide](./Docs/Development_Guide.md) for guidelines.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- F1 car models used for educational purposes
- Inspiration from official F1 broadcasts and games
