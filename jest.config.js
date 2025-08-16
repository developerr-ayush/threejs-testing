/**
 * Jest configuration for testing
 */

export default {
  // Use ESM modules
  type: "module",

  // Test environment
  testEnvironment: "jsdom",

  // File extensions to consider
  moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "json"],

  // Transform files
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Transformations to ignore
  transformIgnorePatterns: ["/node_modules/(?!three|@three)"],

  // Test match patterns
  testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.js", "!src/main.js", "!**/node_modules/**"],

  // Test setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Mock file imports
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/tests/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
};
