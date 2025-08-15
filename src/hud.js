import * as THREE from "three";
import { f1CarSpecs } from "./config.js";

// Create a HUD scene and camera for 2D overlay
export function createHUD() {
  // Create an orthographic camera for HUD
  const hudCamera = new THREE.OrthographicCamera(
    -window.innerWidth / 2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    -window.innerHeight / 2,
    0,
    30
  );

  // Create a separate scene for HUD elements
  const hudScene = new THREE.Scene();

  // Add HUD elements
  const elements = createHUDElements();
  elements.forEach((element) => hudScene.add(element));

  return { hudScene, hudCamera, elements };
}

// Create F1-style HUD elements
function createHUDElements() {
  const elements = [];

  // Speed display (bottom right)
  const speedMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
  });

  // Create a canvas for text rendering
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  // Create a texture from the canvas
  const speedTexture = new THREE.CanvasTexture(canvas);
  const speedGeometry = new THREE.PlaneGeometry(256, 128);
  const speedDisplay = new THREE.Mesh(
    speedGeometry,
    new THREE.MeshBasicMaterial({
      map: speedTexture,
      transparent: true,
    })
  );

  // Position in bottom right
  speedDisplay.position.set(
    window.innerWidth / 2 - 150,
    -window.innerHeight / 2 + 100,
    1
  );

  // Store the context for updating
  speedDisplay.userData = { context, texture: speedTexture };
  elements.push(speedDisplay);

  return elements;
}

// Update HUD with car data
export function updateHUD(hudElements, carData) {
  if (!hudElements || !carData) return;

  // Find speed display
  const speedDisplay = hudElements[0];
  if (!speedDisplay || !speedDisplay.userData.context) return;

  const { context, texture } = speedDisplay.userData;
  const { speed, rpm, gear } = carData;

  // Clear canvas
  context.clearRect(0, 0, 256, 128);

  // Draw speed
  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(0, 0, 256, 128);

  // Speed
  context.font = "bold 48px Arial";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(Math.round(speed), 128, 60);

  // KPH label
  context.font = "24px Arial";
  context.fillText("KPH", 128, 90);

  // Gear
  if (gear !== undefined) {
    context.font = "bold 32px Arial";
    context.fillStyle = "yellow";
    context.fillText(gear === 0 ? "N" : gear, 200, 50);
  }

  // RPM bar if available
  if (rpm !== undefined) {
    const rpmPercent = rpm / f1CarSpecs.maxRPM;
    const barWidth = 200;
    const barHeight = 10;

    // Background
    context.fillStyle = "rgba(50, 50, 50, 0.8)";
    context.fillRect(28, 100, barWidth, barHeight);

    // RPM fill
    let rpmColor = "green";
    if (rpm > f1CarSpecs.redlineRPM) {
      rpmColor = "red";
    } else if (rpm > f1CarSpecs.redlineRPM * 0.8) {
      rpmColor = "orange";
    }

    context.fillStyle = rpmColor;
    context.fillRect(28, 100, barWidth * rpmPercent, barHeight);
  }

  // Update the texture
  texture.needsUpdate = true;
}

// Resize HUD elements when window is resized
export function resizeHUD(hudCamera, hudElements) {
  hudCamera.left = -window.innerWidth / 2;
  hudCamera.right = window.innerWidth / 2;
  hudCamera.top = window.innerHeight / 2;
  hudCamera.bottom = -window.innerHeight / 2;
  hudCamera.updateProjectionMatrix();

  // Reposition elements
  if (hudElements && hudElements.length > 0) {
    const speedDisplay = hudElements[0];
    speedDisplay.position.set(
      window.innerWidth / 2 - 150,
      -window.innerHeight / 2 + 100,
      1
    );
  }
}
