/**
 * Tests for 3D math utility functions
 */

import * as THREE from "three";
import {
  getGroundYAt,
  snapObjectToTrack,
  getCurveTangent,
  getAlignmentQuaternion,
  createSmoothCurve,
  resampleCurve,
  getCurveLength,
  createCurveLine,
} from "../../src/utils/math3d.js";

// Mock THREE.js objects and functions
jest.mock("three", () => {
  const actualThree = jest.requireActual("three");

  return {
    ...actualThree,
    Raycaster: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      intersectObject: jest.fn().mockReturnValue([]),
    })),
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      set: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      sub: jest.fn().mockReturnThis(),
      subVectors: jest.fn().mockReturnThis(),
      crossVectors: jest.fn().mockReturnThis(),
      normalize: jest.fn().mockReturnThis(),
      multiplyScalar: jest.fn().mockReturnThis(),
      distanceTo: jest.fn().mockReturnValue(1),
      dot: jest.fn().mockReturnValue(0.5),
      clone: jest.fn().mockReturnThis(),
    })),
    Quaternion: jest.fn().mockImplementation(() => ({
      setFromAxisAngle: jest.fn().mockReturnThis(),
    })),
    CatmullRomCurve3: jest.fn().mockImplementation(() => ({
      getPointAt: jest.fn().mockReturnValue(new actualThree.Vector3()),
      getPoints: jest
        .fn()
        .mockReturnValue([
          new actualThree.Vector3(0, 0, 0),
          new actualThree.Vector3(1, 0, 0),
          new actualThree.Vector3(2, 0, 0),
        ]),
      getSpacedPoints: jest
        .fn()
        .mockReturnValue([
          new actualThree.Vector3(0, 0, 0),
          new actualThree.Vector3(1, 0, 0),
          new actualThree.Vector3(2, 0, 0),
        ]),
    })),
    BufferGeometry: jest.fn().mockImplementation(() => ({
      setFromPoints: jest.fn().mockReturnThis(),
    })),
    LineBasicMaterial: jest.fn(),
    Line: jest.fn(),
  };
});

describe("Math3D Utilities", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getGroundYAt", () => {
    test("should return defaultY when trackMesh is null", () => {
      // Act
      const result = getGroundYAt(null, 0, 0, 1000, 5);

      // Assert
      expect(result).toBe(5);
    });

    test("should return intersection point y when ray hits", () => {
      // Arrange
      const mockTrackMesh = {};
      const mockRaycaster = new THREE.Raycaster();
      mockRaycaster.intersectObject.mockReturnValue([{ point: { y: 10 } }]);

      // Act
      const result = getGroundYAt(mockTrackMesh, 0, 0);

      // Assert
      expect(result).toBe(10);
      expect(mockRaycaster.intersectObject).toHaveBeenCalledWith(
        mockTrackMesh,
        true
      );
    });
  });

  describe("snapObjectToTrack", () => {
    test("should do nothing when object or trackMesh is null", () => {
      // Arrange
      const mockObject = { position: { y: 5 } };

      // Act
      snapObjectToTrack(mockObject, null);

      // Assert
      expect(mockObject.position.y).toBe(5);
    });

    test("should set object y position based on ground y plus offset", () => {
      // Arrange
      const mockObject = { position: { x: 0, y: 5, z: 0 } };
      const mockTrackMesh = {};
      const mockRaycaster = new THREE.Raycaster();
      mockRaycaster.intersectObject.mockReturnValue([{ point: { y: 10 } }]);

      // Act
      snapObjectToTrack(mockObject, mockTrackMesh, 2);

      // Assert
      expect(mockObject.position.y).toBe(12); // 10 (ground) + 2 (offset)
    });
  });

  describe("getCurveTangent", () => {
    test("should calculate tangent using points before and after t", () => {
      // Arrange
      const mockCurve = {
        getPointAt: jest
          .fn()
          .mockReturnValueOnce(new THREE.Vector3(0, 0, 0))
          .mockReturnValueOnce(new THREE.Vector3(1, 0, 0)),
      };

      // Act
      const result = getCurveTangent(mockCurve, 0.5);

      // Assert
      expect(mockCurve.getPointAt).toHaveBeenCalledTimes(2);
      expect(result.normalize).toHaveBeenCalled();
    });
  });

  describe("createSmoothCurve", () => {
    test("should create a CatmullRomCurve3 with provided points", () => {
      // Arrange
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(2, 0, 0),
      ];

      // Act
      createSmoothCurve(points, true);

      // Assert
      expect(THREE.CatmullRomCurve3).toHaveBeenCalledWith(
        points,
        true,
        "catmullrom"
      );
    });
  });

  describe("resampleCurve", () => {
    test("should call getSpacedPoints with correct number of points", () => {
      // Arrange
      const mockCurve = {
        getSpacedPoints: jest.fn().mockReturnValue([]),
      };
      const numPoints = 10;

      // Act
      resampleCurve(mockCurve, numPoints);

      // Assert
      expect(mockCurve.getSpacedPoints).toHaveBeenCalledWith(numPoints - 1);
    });
  });

  describe("getCurveLength", () => {
    test("should calculate length by summing point distances", () => {
      // Arrange
      const mockPoints = [
        { distanceTo: jest.fn().mockReturnValue(0) },
        { distanceTo: jest.fn().mockReturnValue(5) },
        { distanceTo: jest.fn().mockReturnValue(7) },
      ];
      const mockCurve = {
        getPoints: jest.fn().mockReturnValue(mockPoints),
      };

      // Act
      const result = getCurveLength(mockCurve, 2);

      // Assert
      expect(mockCurve.getPoints).toHaveBeenCalledWith(2);
      expect(mockPoints[1].distanceTo).toHaveBeenCalled();
      expect(mockPoints[2].distanceTo).toHaveBeenCalled();
      expect(result).toBe(12); // 5 + 7
    });
  });

  describe("createCurveLine", () => {
    test("should create a Line with curve points", () => {
      // Arrange
      const mockCurve = {
        getPoints: jest.fn().mockReturnValue([]),
      };

      // Act
      createCurveLine(mockCurve, 100, 0xff0000);

      // Assert
      expect(mockCurve.getPoints).toHaveBeenCalledWith(99);
      expect(THREE.BufferGeometry).toHaveBeenCalled();
      expect(THREE.LineBasicMaterial).toHaveBeenCalledWith({ color: 0xff0000 });
      expect(THREE.Line).toHaveBeenCalled();
    });
  });
});
