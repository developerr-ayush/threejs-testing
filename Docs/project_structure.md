# F1 Visualizer Project Structure

## Overview

This project creates an interactive F1 race visualization system with realistic car physics, camera modes, and telemetry display. Built using Three.js and Cannon.js, it provides a foundation for simulating F1 racing with accurate track representation and car handling.

## Directory Structure

```
threejs-testing/
├── Docs/                     # Project documentation
│   ├── Bug_tracking.md       # Known issues and resolutions
│   ├── Implementation.md     # Implementation stages and progress
│   └── project_structure.md  # This file - project organization
├── index.html                # Main HTML entry point
├── package.json              # Project dependencies and scripts
├── public/                   # Static assets
│   └── models/               # 3D model files
│       ├── track.glb         # Race track model
│       ├── red_bull.glb      # F1 car models
│       ├── aston_martin.glb
│       ├── mclaren_2021.glb
│       └── mclaren_2022.glb
└── src/                      # Source code
    ├── main.js               # Application entry point and main loop
    ├── config.js             # Configuration settings and constants
    ├── cameras.js            # Camera setup and management
    ├── controls.js           # User input handling
    ├── hud.js                # Heads-up display for telemetry
    ├── loadModels.js         # Asset loading utilities
    ├── physics.js            # Physics simulation using Cannon.js
    ├── racepath.json         # Track path data for AI and visualization
    └── scene.js              # Three.js scene setup and management
```

## Core Components

### Rendering and Setup

- **main.js**: Application entry point, animation loop, and core logic
- **scene.js**: Three.js scene configuration with lighting and environment
- **loadModels.js**: GLB model loading and processing

### Physics and Movement

- **physics.js**: Cannon.js physics world setup and body creation
- **controls.js**: Keyboard input handling for car control
- **config.js**: Physics parameters, car specifications, and control settings

### Visualization

- **cameras.js**: Multiple camera perspectives (Top, Chase, Bottom, T-Cam, Front Wing)
- **hud.js**: F1-style telemetry display with speed, RPM, and gear indicators

### Data

- **racepath.json**: Track path definition for AI cars and race line visualization

## Key Features

### Camera System

- Multiple F1-inspired camera angles
- Smooth camera transitions and following behavior
- Free-roaming helper camera for debugging

### Car Physics

- Kinematic movement with acceleration, drag, and braking
- Simulated F1 characteristics (gears, RPM, speed)
- Optional Cannon.js physics integration

### User Interface

- F1-style HUD with speed, RPM bar, and gear indicator
- Interactive camera controls (press 'C' to cycle)
- Toggle HUD display (press 'H')

### Car Control

- WASD driving controls
- Shift modifier for strafing
- Realistic acceleration and braking

## Development

### Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Key Controls

- **W/S**: Accelerate/Brake
- **A/D**: Steer left/right
- **Shift+A/D**: Strafe left/right
- **C**: Cycle camera modes
- **H**: Toggle HUD display

## Future Enhancements

- Track checkpoints and lap timing
- Ghost trail for previous lap visualization
- Enhanced telemetry and performance metrics
- Audio effects for engine sounds
- Visual effects (tire smoke, sparks)
- AI opponents with realistic racing behavior
