## Implementation Details

This document provides a detailed breakdown of the application's features and their implementation.

### Core Architecture

The application is built on **Three.js** for 3D rendering and **cannon-es** for physics simulation. It operates in one of three modes, determined by the `APP_MODE` global variable, which is set in each of the main HTML files (`index.html`, `simulation.html`, `path.html`).

- **`index` mode**: The default mode, showcasing an automated race simulation where cars follow a predefined or custom-assigned path. User interaction is primarily for camera control.
- **`simulation` mode (Drive-to-Create)**: Allows the user to drive a car manually using keyboard controls. This mode is also used for creating new race paths by recording the car's movement.
- **`path` mode**: A manual path editor that allows for the creation and modification of race paths by placing points in the 3D space.

The main logic is orchestrated in `src/main.js`, which handles initialization, the main animation loop, and integrates all the different modules.

### Feature Breakdown

- [ ] **3D Scene and Models**

  - The main scene is created in `src/scene.js`.
  - 3D models (`.glb` format) for the track and cars are loaded via `src/loadModels.js`.
  - `src/fixMaterials.js` is used to programmatically correct material properties on loaded models to ensure they respond correctly to lighting.

- [ ] **Physics Simulation**

  - The physics world is managed by `cannon-es` and configured in `src/physics.js`.
  - Physics bodies are created for the track and cars, allowing for realistic interactions.
  - Physics are optional and can be enabled/disabled via the `gameplayConfig.physicsEnabled` flag in `src/config.js`.

- [ ] **Lighting System**

  - The lighting setup is defined in `src/scene.js` and can be dynamically updated.
  - It includes ambient, hemisphere, directional (sun), and multiple spotlights.
  - `src/lightDebug.js` and `src/resetLighting.js` provide extensive debugging capabilities, including light helpers and functions to fix common lighting issues.
  - Lighting settings can be adjusted in real-time through the `lil-gui` panel and exported to the console.

- [ ] **Camera System**

  - Multiple camera types are defined in `src/cameras.js`, including a main follow-camera and a free-orbit helper camera.
  - `src/cameraManager.js` handles switching between different camera views (e.g., cycling through cars, switching to the helper camera).

- [ ] **Car Control and AI**

  - **Manual Control**: In `simulation` mode, the primary car is controlled via the keyboard. `src/controls.js` handles keyboard input and updates the car's physics body or kinematic state.
  - **AI Control**: In `index` (race) mode, cars are controlled by the AI in `src/carAI.js`. The AI makes the cars follow a `THREE.CatmullRomCurve3` path. Different cars can be assigned different paths, or they can all follow the default `racepath.json`.

- [ ] **Path Creation and Management**

  - **Manual Path Editor**: The `path.html` entry point initializes the editor from `src/pathEditor.js`, allowing users to click in the scene to create points for a path and then export it as JSON.
  - **Drive-to-Create**: The `simulation.html` entry point, via `src/createPath.js`, allows a user to drive a car and record its positions to create a new path. This path can be saved to `localStorage`.
  - Paths saved from either method can be assigned to any car in `index` mode through the GUI.

- [ ] **Heads-Up Display (HUD)**

  - A simple HUD is implemented in `src/hud.js`, which displays information like speed, RPM, and gear.
  - The HUD is rendered in a separate scene and overlaid on top of the main scene. It is only visible when in a driving camera view.

- [ ] **Debugging and Development Tools**
  - **GUI**: `lil-gui` is used extensively to provide a debug panel with controls for almost every aspect of the simulation, including car positions, race parameters, lighting, and path visualization.
  - **Debug Utilities**: `src/debugUtils.js` provides visual aids like a grid, axes helpers, and a performance monitor.
  - **Console Helpers**: A rich set of helper functions is exposed on the `window` object for debugging from the browser's developer console. This includes functions to capture camera/car coordinates, manage saved paths, and set car transforms.
