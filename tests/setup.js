/**
 * Jest setup file
 * Sets up the testing environment
 */

// Mock browser globals that might be missing in JSDOM
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = function () {
  return {
    // WebGL context mock
    viewport: jest.fn(),
    clearColor: jest.fn(),
    clear: jest.fn(),
    enable: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    getUniformLocation: jest.fn(),
    uniform1f: jest.fn(),
    uniform1i: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    getShaderParameter: jest.fn().mockReturnValue(true),
    getProgramParameter: jest.fn().mockReturnValue(true),
    getShaderInfoLog: jest.fn(),
    getProgramInfoLog: jest.fn(),
  };
};

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(""),
  },
  writable: true,
});
