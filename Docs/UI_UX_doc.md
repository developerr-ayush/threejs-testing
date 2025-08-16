## UI/UX Documentation

This document covers the user interface (UI) and user experience (UX) design of the application.

### Main Interface

The primary interface is the 3D rendered scene itself. There is minimal traditional UI to maximize immersion. The UI consists of three main components:

1.  **Navigation Links**: Simple HTML links at the top-left of the screen allow the user to switch between the three application modes: `simulation`, `drive-to-create`, and `manual-path`.
2.  **Heads-Up Display (HUD)**: In `simulation` (driving) mode, a HUD is displayed with real-time car data.
3.  **Debug GUI**: A comprehensive debug panel powered by `lil-gui` is available on the right side of the screen. This is the primary method for interacting with and controlling the simulation's parameters.

### User Flow and Interaction

#### `index.html` (Simulation Viewer)

- **Primary Goal**: Observe the automated car race.
- **Interactions**:
  - Use the mouse to orbit, pan, and zoom the helper camera for different viewing angles.
  - Use number keys (`1`, `2`, etc.) to switch to follow-cameras for each car.
  - Use the `lil-gui` panel to assign different saved paths to cars or adjust their speeds to see how it affects the race outcome.

#### `simulation.html` (Drive-to-Create)

- **Primary Goal**: Drive a car manually and/or create a new path by recording the drive.
- **Interactions**:
  - **Driving**:
    - `W` / `ArrowUp`: Accelerate
    - `S` / `ArrowDown`: Brake/Reverse
    - `A` / `ArrowLeft`: Steer Left
    - `D` / `ArrowRight`: Steer Right
  - **Path Recording**:
    - Use the `lil-gui` "Drive-to-Create Path" panel to name a path and start/stop recording.
    - The recorded path is automatically saved to the browser's `localStorage`.

#### `path.html` (Manual Path Editor)

- **Primary Goal**: Manually create or edit a race path.
- **Interactions**:
  - Use the mouse to navigate the scene.
  - `Left-click` on the track to add a new point to the path.
  - Use the `lil-gui` "Path Creator" panel to export the created path to the console/clipboard as a JSON object.

### Design and Style Guide

- **Aesthetic**: The visual style is realistic, aiming for a clean simulation look.
- **HUD Design**: The HUD uses a simple, clear font to display key metrics (speed, RPM, gear) without obstructing the view of the track.
- **Debug Panel**: The `lil-gui` panel uses its default styling, which is clean and functional, suitable for a development tool. It is organized into collapsible folders to keep the interface tidy.

### Accessibility

- The application is primarily visual and relies on mouse and keyboard input.
- Keyboard controls for driving are mapped to standard WASD and arrow keys for familiarity.
- Camera controls follow standard 3D application conventions (orbit, pan, zoom).
