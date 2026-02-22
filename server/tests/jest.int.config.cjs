/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.setup.ts'],
  clearMocks: true,
  restoreMocks: true,
  // Integration tests share a single DB: keep sequential unless you implement per-worker schemas.
  maxWorkers: 1,
};
