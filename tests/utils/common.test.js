/**
 * Tests for common utility functions
 */

import {
  readFromStorage,
  writeToStorage,
  clamp,
  lerp,
  degToRad,
  radToDeg,
  generateUUID,
} from "../../src/utils/common.js";

describe("Common Utilities", () => {
  // Setup mock localStorage
  let localStorageMock;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      store: {},
      getItem: jest.fn((key) => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        localStorageMock.store = {};
      }),
    };

    // Replace global localStorage with mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  describe("readFromStorage", () => {
    test("should return parsed value when key exists", () => {
      // Arrange
      const testKey = "testKey";
      const testValue = { foo: "bar" };
      localStorageMock.store[testKey] = JSON.stringify(testValue);

      // Act
      const result = readFromStorage(testKey);

      // Assert
      expect(result).toEqual(testValue);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(testKey);
    });

    test("should return defaultValue when key does not exist", () => {
      // Arrange
      const testKey = "nonExistentKey";
      const defaultValue = { default: true };

      // Act
      const result = readFromStorage(testKey, defaultValue);

      // Assert
      expect(result).toEqual(defaultValue);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(testKey);
    });

    test("should return defaultValue on parse error", () => {
      // Arrange
      const testKey = "invalidJsonKey";
      const defaultValue = { default: true };
      localStorageMock.store[testKey] = "{invalid json";

      // Act
      const result = readFromStorage(testKey, defaultValue);

      // Assert
      expect(result).toEqual(defaultValue);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(testKey);
    });
  });

  describe("writeToStorage", () => {
    test("should write stringified value to localStorage", () => {
      // Arrange
      const testKey = "writeKey";
      const testValue = { foo: "bar" };

      // Act
      const result = writeToStorage(testKey, testValue);

      // Assert
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue)
      );
    });

    test("should return false on error", () => {
      // Arrange
      const testKey = "errorKey";
      const testValue = { foo: "bar" };

      // Mock an error when setItem is called
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });

      // Act
      const result = writeToStorage(testKey, testValue);

      // Assert
      expect(result).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue)
      );
    });
  });

  describe("clamp", () => {
    test("should return value when within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    test("should return min when value is below min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    test("should return max when value is above max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    test("should work with decimal values", () => {
      expect(clamp(3.5, 1.5, 4.5)).toBe(3.5);
      expect(clamp(1.0, 1.5, 4.5)).toBe(1.5);
      expect(clamp(5.0, 1.5, 4.5)).toBe(4.5);
    });
  });

  describe("lerp", () => {
    test("should return start value when t is 0", () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    test("should return end value when t is 1", () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    test("should interpolate correctly when t is between 0 and 1", () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
      expect(lerp(10, 20, 0.25)).toBe(12.5);
      expect(lerp(10, 20, 0.75)).toBe(17.5);
    });

    test("should extrapolate correctly when t is outside 0-1 range", () => {
      expect(lerp(10, 20, 2)).toBe(30);
      expect(lerp(10, 20, -1)).toBe(0);
    });
  });

  describe("degToRad", () => {
    test("should convert degrees to radians correctly", () => {
      expect(degToRad(0)).toBeCloseTo(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(180)).toBeCloseTo(Math.PI);
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });
  });

  describe("radToDeg", () => {
    test("should convert radians to degrees correctly", () => {
      expect(radToDeg(0)).toBeCloseTo(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });
  });

  describe("generateUUID", () => {
    test("should generate a valid UUID format", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    test("should generate different UUIDs on each call", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toEqual(uuid2);
    });
  });
});
