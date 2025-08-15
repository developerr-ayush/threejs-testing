# F1 Visualizer UI/UX Documentation

This document outlines the user interface and experience design for the F1 Visualizer project.

## Core UI Components

### Main Viewport

- Full-screen Three.js canvas
- Responsive design that maintains aspect ratio
- Performance indicators (FPS counter) in debug mode

### Heads-Up Display (HUD)

#### Speed and RPM Display

- Position: Bottom right corner
- Components:
  - Speed in km/h (large, white text)
  - RPM bar (color changes: green → orange → red as RPM increases)
  - Current gear indicator (yellow text)
  - Future: Lap time and position information

#### Mini-Map (Planned)

- Position: Bottom left corner
- Components:
  - Top-down view of track
  - Current car position indicator
  - Other cars' positions
  - Sector markers

#### Telemetry Display (Planned)

- Position: Right side, collapsible
- Components:
  - Throttle/brake input visualization
  - G-force indicator
  - Tire temperature/wear
  - Detailed timing information

### GUI Controls

- Based on lil-gui library
- Collapsible panels for different control categories
- Categories:
  - Camera Controls
  - Manual Controls (car positioning)
  - Race Controls (AI behavior)
  - Car 1 Utils (reset, teleport)
  - Capture (coordinate logging)

## Camera System

### Camera Modes

1. **Top View**

   - High overhead perspective
   - Good for general orientation and track overview

2. **Chase View**

   - Behind and slightly above the car
   - Traditional racing game perspective

3. **Bottom View**

   - View from underneath the car
   - Useful for checking ground clearance and suspension

4. **T-Cam**

   - F1 broadcast-style onboard camera
   - Positioned above driver's head
   - Shows steering inputs and forward track

5. **Front Wing**

   - Low perspective from front wing
   - Dramatic sense of speed and immersion

6. **Helper Camera** (Debug)
   - Free-roaming camera
   - Orbit controls for inspection
   - Not tied to car movement

### Camera Transitions

- Smooth interpolation between positions (0.2 lerp factor)
- Maintains focus on car during transitions
- Quick switching with 'C' key

## Control Scheme

### Keyboard Controls

- **W/S**: Accelerate/Brake
- **A/D**: Steer left/right
- **Shift+A/D**: Strafe left/right (lateral movement)
- **C**: Cycle camera modes
- **H**: Toggle HUD visibility

### GUI Interactions

- Sliders for precise positioning
- Dropdown menus for mode selection
- Toggle switches for features
- Action buttons for utilities

## Visual Feedback

### Car Movement

- Visual rotation matches steering input
- Speed-appropriate movement
- Planned: Suspension effects, body roll

### Performance Indicators

- Console logging of position and speed
- FPS counter (planned)
- Physics debug visualization (planned)

## Accessibility Considerations

### Visual

- High contrast HUD elements
- Configurable HUD scale (planned)
- Color schemes suitable for color vision deficiencies (planned)

### Controls

- Rebindable keys (planned)
- Controller support (planned)

## Future UI Enhancements

### Race Director Mode

- Multiple camera views
- Automatic camera switching based on action
- Picture-in-picture for other cars

### Replay System

- Timeline scrubber
- Multiple camera angles
- Highlight markers for key events

### Setup Menu

- Car setup adjustments
- Track condition settings
- Weather controls

## Design Guidelines

### Color Palette

- Primary: Racing team colors (red, blue, green)
- Secondary: Dark UI backgrounds with high contrast text
- Accent: Yellow for important information
- Status: Green/Orange/Red for performance indicators

### Typography

- Sans-serif fonts for readability
- Large, bold numbers for speed and timing
- Condensed fonts for detailed information panels

### Layout Principles

- Critical information centered or bottom-right
- Non-essential controls collapsible
- Maintain clear view of track and action
- Responsive design that scales with window size
