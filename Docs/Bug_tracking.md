# F1 Visualizer Bug Tracking

This document tracks known issues, their status, and resolutions for the F1 Visualizer project.

## Active Issues

### Physics and Movement

| ID  | Description                                             | Status | Priority | Workaround                                                   |
| --- | ------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------ |
| P01 | Car sinks through track when physics enabled            | Fixed  | High     | Disable physics with `gameplayConfig.physicsEnabled = false` |
| P02 | Car rotation not applying correctly when using A/D keys | Fixed  | High     | Use Shift+A/D for lateral movement instead                   |
| P03 | Collision detection sometimes fails at high speeds      | Open   | Medium   | Reduce maximum speed or increase physics timestep            |

### Camera and Rendering

| ID  | Description                                          | Status | Priority | Workaround                         |
| --- | ---------------------------------------------------- | ------ | -------- | ---------------------------------- |
| C01 | Camera can clip through track geometry in chase mode | Open   | Low      | Use T-cam or top view instead      |
| C02 | HUD elements don't scale properly on window resize   | Open   | Medium   | Manually refresh page after resize |

### Controls and Input

| ID  | Description                                           | Status | Priority | Workaround                                         |
| --- | ----------------------------------------------------- | ------ | -------- | -------------------------------------------------- |
| I01 | Multiple key presses can cause unpredictable movement | Open   | Medium   | Press keys sequentially rather than simultaneously |

## Resolved Issues

### Physics and Movement

| ID  | Description                            | Resolution                                    | Fixed Version |
| --- | -------------------------------------- | --------------------------------------------- | ------------- |
| P04 | Y-coordinate drift causing car to fall | Implemented kinematic controller with fixed Y | v0.2.0        |
| P05 | Car teleporting on state updates       | Added interpolation between position updates  | v0.2.0        |

### Camera and Rendering

| ID  | Description                   | Resolution                                       | Fixed Version |
| --- | ----------------------------- | ------------------------------------------------ | ------------- |
| C03 | Missing bottom camera view    | Added bottom camera configuration                | v0.3.0        |
| C04 | Camera transitions too abrupt | Implemented smooth lerp between camera positions | v0.2.0        |

## Reporting New Issues

When reporting new issues, please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and system information
5. Screenshots or video if applicable

## Performance Issues

| ID   | Description                          | Status | Impact | Mitigation                                     |
| ---- | ------------------------------------ | ------ | ------ | ---------------------------------------------- |
| PF01 | FPS drops with more than 10 cars     | Open   | Medium | Reduce car model complexity or disable shadows |
| PF02 | Memory leak during extended sessions | Open   | Low    | Restart application every few hours            |

## Known Limitations

- Physics simulation is simplified and not fully accurate to F1 car dynamics
- Track collision mesh is simplified for performance
- No support for mobile devices/touch controls
- Limited weather and environmental effects
