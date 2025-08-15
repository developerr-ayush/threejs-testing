# F1 Visualizer Development Guide

This document provides guidelines and best practices for developers working on the F1 Visualizer project.

## Development Environment

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Modern web browser with WebGL support
- Basic knowledge of Three.js and ES6 JavaScript

### Setup

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

## Project Architecture

### Core Principles

- **Modularity**: Each file has a specific responsibility
- **Configuration-driven**: Key parameters in config.js
- **Performance-first**: Optimize for smooth rendering
- **Extensibility**: Easy to add new features

### File Organization

- Keep related functionality in the same file
- Use clear, descriptive names for functions and variables
- Follow existing patterns for new features

## Coding Standards

### JavaScript

- Use ES6+ features (arrow functions, destructuring, etc.)
- Follow camelCase for variables and functions
- Follow PascalCase for classes and constructors
- Use meaningful variable names that describe purpose

### Three.js Best Practices

- Dispose of geometries, materials, and textures when no longer needed
- Use object pooling for frequently created/destroyed objects
- Minimize draw calls by combining geometries where appropriate
- Use LOD (Level of Detail) for complex models

### Physics

- Keep physics world synchronized with visual world
- Use appropriate collision shapes (not always full mesh)
- Tune parameters in small increments
- Test physics at various framerates

## Adding New Features

### New Camera Modes

1. Add configuration to `followCameraConfig` in config.js
2. Update camera mode cycling in main.js
3. Add to GUI options in camera controls

### New HUD Elements

1. Create new element in createHUDElements() in hud.js
2. Position appropriately based on screen dimensions
3. Add update logic in updateHUD()
4. Ensure proper scaling in resizeHUD()

### New Car Controls

1. Add key bindings in keyboardControls in config.js
2. Implement handling in controls.js
3. Update physics response in main.js

## Performance Optimization

### Rendering

- Use appropriate LOD (Level of Detail)
- Optimize shadows (resolution, distance, etc.)
- Consider using InstancedMesh for multiple similar objects
- Limit draw calls by combining geometries

### Physics

- Use simplified collision shapes
- Adjust solver iterations based on complexity
- Consider disabling physics for distant objects

### Memory Management

- Dispose unused Three.js objects
- Monitor for memory leaks using browser tools
- Implement object pooling for frequently created/destroyed objects

## Debugging

### Console Commands

- `window.setCar1Transform({ position: {x, y, z}, yaw })`: Teleport Car 1
- `window.carTargets`: Access car target positions
- Future: Add more debug helpers as needed

### Visual Debugging

- Enable Axes Helper and Grid Helper in GUI
- Use browser dev tools for performance monitoring
- Check for WebGL errors in console

## Testing

### Performance Testing

- Test on various hardware configurations
- Monitor FPS during complex scenes
- Check memory usage during extended sessions

### Functional Testing

- Verify car controls work as expected
- Test camera transitions
- Ensure HUD updates correctly

## Deployment

### Building for Production

```bash
npm run build
```

### Optimizations for Production

- Enable code minification
- Optimize assets (models, textures)
- Consider lazy-loading non-essential components

## Contributing

### Pull Request Process

1. Create a feature branch from main
2. Implement changes following coding standards
3. Test thoroughly
4. Submit PR with clear description of changes

### Documentation

- Update relevant documentation when adding features
- Document known issues in Bug_tracking.md
- Keep Implementation.md up to date with progress
