import { getFollowCameraTransform, setCameraAspect } from "./cameras.js";

// Maps human-readable names to follow modes used in config/followCameraConfig
const NAME_TO_MODE = {
  Chase: "chase",
  Top: "top",
  Bottom: "bottom",
  T_Cam: "t_cam",
  T_Cam_Label: "T_Cam", // internal helper for label
  Front_Wing: "front_wing",
  Helper: "helper",
};

function storageKeyForPage(pageId) {
  // Match requested keys from the spec
  if (pageId === "index") return "camera_index.html";
  if (pageId === "simulation") return "camera_simulation.html";
  if (pageId === "path") return "camera_path.html";
  return `camera_${pageId}`;
}

function carStorageKeyForIndex() {
  return "selected_car_index.html";
}

function createOverlay() {
  let el = document.getElementById("camera-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "camera-overlay";
    Object.assign(el.style, {
      position: "fixed",
      top: "8px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "6px 10px",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "12px",
      borderRadius: "6px",
      pointerEvents: "none",
      zIndex: 20,
      opacity: "0",
      transition: "opacity 0.15s ease",
    });
    document.body.appendChild(el);
  }
  return el;
}

export class CameraManager {
  constructor({
    pageId,
    availableCameras, // array of labels e.g. ["Chase","Top",...]
    followCamera,
    helperCamera,
    orbitControls,
    getCarCount,
    getCarPose, // (index) => { position: THREE.Vector3|CANNON.Vec3, quaternion: THREE.Quaternion|CANNON.Quaternion }
    smoothing = 0.2,
  }) {
    this.pageId = pageId;
    this.availableCameras = availableCameras;
    this.followCamera = followCamera;
    this.helperCamera = helperCamera;
    this.orbitControls = orbitControls;
    this.getCarCount = getCarCount;
    this.getCarPose = getCarPose;
    this.smoothing = smoothing;

    this.overlayEl = createOverlay();
    this.overlayTimer = null;

    // Load persisted selections
    this.selectedCameraIndex = this.#loadSelectedCameraIndex();
    this.previousFollowIndex = Math.min(
      this.selectedCameraIndex,
      this.availableCameras.length - 1
    );
    this.selectedCarIndex = this.#loadSelectedCarIndex();

    // Key handling
    this._onKeyDownBound = this.#onKeyDown.bind(this);
    window.addEventListener("keydown", this._onKeyDownBound);
  }

  // Public API
  getActiveCamera() {
    const label = this.availableCameras[this.selectedCameraIndex] || "Chase";
    return label === "Helper" ? this.helperCamera : this.followCamera;
  }

  getSelectedCarIndex() {
    return this.selectedCarIndex;
  }

  setSelectedCarIndex(i) {
    const count = Math.max(0, (this.getCarCount && this.getCarCount()) || 0);
    if (!count) return;
    this.selectedCarIndex = ((i % count) + count) % count;
    this.#persistCarIndex();
  }

  update() {
    const label = this.availableCameras[this.selectedCameraIndex] || "Chase";
    if (label === "Helper") return; // orbit camera handled externally

    const mode = this.#labelToMode(label);
    const carIdx = this.getSelectedCarIndex();
    const pose = this.getCarPose ? this.getCarPose(carIdx) : null;
    if (!pose) return;

    const { position, quaternion } = pose;
    if (!position || !quaternion) return;

    const { cameraPos, lookAt } = getFollowCameraTransform(
      position,
      quaternion,
      mode
    );
    if (this.smoothing && this.smoothing > 0 && this.smoothing < 1) {
      this.followCamera.position.lerp(cameraPos, this.smoothing);
    } else {
      this.followCamera.position.copy(cameraPos);
    }
    this.followCamera.lookAt(lookAt);
  }

  resize(width, height) {
    const aspect = width / height;
    setCameraAspect(this.followCamera, aspect);
    setCameraAspect(this.helperCamera, aspect);
  }

  dispose() {
    if (this._onKeyDownBound)
      window.removeEventListener("keydown", this._onKeyDownBound);
  }

  // Internals
  #onKeyDown(e) {
    const k = e.key.toLowerCase();
    // Number keys: 1..9 map to camera list index
    if (k >= "1" && k <= "9") {
      const idx = parseInt(k, 10) - 1;
      if (idx < this.availableCameras.length) {
        this.#selectCameraIndex(idx);
      }
      return;
    }

    // Toggle helper with 'h'
    if (k === "h") {
      const isHelper =
        this.availableCameras[this.selectedCameraIndex] === "Helper";
      if (isHelper) {
        // return to previous non-helper camera
        this.#selectCameraIndex(this.previousFollowIndex ?? 0);
      } else {
        // store and switch to helper
        this.previousFollowIndex = this.selectedCameraIndex;
        const helperIdx = this.availableCameras.indexOf("Helper");
        if (helperIdx !== -1) this.#selectCameraIndex(helperIdx);
      }
      return;
    }

    // Cycle cars with 'c' on index page only
    if (k === "c" && this.pageId === "index") {
      const count = (this.getCarCount && this.getCarCount()) || 0;
      if (!count) return;
      this.setSelectedCarIndex(this.selectedCarIndex + 1);
      // Keep same camera; show car idx overlay
      this.#showOverlay(`Car ${this.selectedCarIndex + 1}`);
    }
  }

  #selectCameraIndex(idx) {
    const capped = Math.min(Math.max(0, idx), this.availableCameras.length - 1);
    this.selectedCameraIndex = capped;
    // Remember last follow camera for toggling back from helper
    if (this.availableCameras[capped] !== "Helper") {
      this.previousFollowIndex = capped;
    }
    this.#persistSelectedCameraIndex();
    this.#showOverlay(this.availableCameras[capped]);
  }

  #labelToMode(label) {
    if (label === "T_Cam") return NAME_TO_MODE.T_Cam;
    return NAME_TO_MODE[label] || "chase";
  }

  #persistSelectedCameraIndex() {
    try {
      const key = storageKeyForPage(this.pageId);
      localStorage.setItem(key, String(this.selectedCameraIndex));
    } catch {}
  }

  #loadSelectedCameraIndex() {
    const key = storageKeyForPage(this.pageId);
    let idx = 0;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) idx = parseInt(raw, 10) || 0;
    } catch {}
    // Clamp
    return Math.min(Math.max(0, idx), this.availableCameras.length - 1);
  }

  #persistCarIndex() {
    if (this.pageId !== "index") return;
    try {
      localStorage.setItem(
        carStorageKeyForIndex(),
        String(this.selectedCarIndex)
      );
    } catch {}
  }

  #loadSelectedCarIndex() {
    if (this.pageId !== "index") return 0;
    let idx = 0;
    try {
      const raw = localStorage.getItem(carStorageKeyForIndex());
      if (raw != null) idx = parseInt(raw, 10) || 0;
    } catch {}
    const count = (this.getCarCount && this.getCarCount()) || 1;
    return Math.min(Math.max(0, idx), Math.max(0, count - 1));
  }

  #showOverlay(text) {
    if (!this.overlayEl) return;
    this.overlayEl.textContent = text;
    this.overlayEl.style.opacity = "1";
    clearTimeout(this.overlayTimer);
    this.overlayTimer = setTimeout(() => {
      if (this.overlayEl) this.overlayEl.style.opacity = "0";
    }, 900);
  }
}

// Helpers to build per-page camera lists
export function getPageCameraList(pageId) {
  if (pageId === "index") {
    return ["Chase", "Top", "Bottom", "T_Cam", "Front_Wing", "Helper"];
  }
  if (pageId === "simulation") {
    return ["Chase", "Top", "Helper"];
  }
  if (pageId === "path") {
    return ["Top", "Helper"];
  }
  return ["Chase", "Helper"];
}
