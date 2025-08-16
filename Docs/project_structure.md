## Project Structure

### Root Directory

- `babel.config.js`: Babel configuration.
- `index.html`: Main entry point for the simulation.
- `jest.config.js`: Jest test runner configuration.
- `package.json`: Project dependencies and scripts.
- `path.html`: Entry point for the manual path editor.
- `public/`: Static assets like 3D models and track data.
- `README.md`: Project overview.
- `simulation.html`: Entry point for the drive-to-create mode.
- `src/`: Main application source code.
- `tests/`: Unit and integration tests.

### `src` Directory

- `cameraManager.js`: Manages different camera modes and perspectives.
- `cameras.js`: Defines and configures the various cameras used in the application.
- `carAI.js`: Implements the artificial intelligence for controlling the cars in race mode.
- `config.js`: Contains all the main configurations for the application, including model paths, car positions, physics settings, and more.
- `controls.js`: Handles keyboard controls for driving the car.
- `createPath.js`: Manages the creation and recording of new paths.
- `debugUtils.js`: Provides utility functions for debugging, such as overlays, grids, and performance monitors.
- `fixMaterials.js`: Contains functions to fix and adjust materials of the 3D models.
- `hud.js`: Manages the heads-up display (HUD) for the driver.
- `lightDebug.js`: Provides tools for debugging lighting issues.
- `loadModels.js`: Handles the loading of all 3D models.
- `main.js`: The main entry point of the application, responsible for initialization and the main animation loop.
- `pathEditor.js`: Implements the manual path editor.
- `physics.js`: Manages the physics simulation using `cannon-es`.
- `racepath.json`: Default race path data.
- `resetLighting.js`: Contains functions to reset the lighting to a default state.
- `scene.js`: Creates and manages the main Three.js scene.
- `utils/`: Utility functions.
  - `common.js`: Common utility functions.
  - `index.js`: Main entry point for utilities.
  - `lighting.js`: Lighting utility functions.
  - `math3d.js`: 3D math utility functions.
  - `renderer.js`: Renderer-related utility functions.
