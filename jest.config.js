module.exports = {
  preset: 'ts-jest',
  //testEnvironment: 'node'
  testEnvironment: 'jest-environment-node-single-context',
  modulePathIgnorePatterns: ['dist/'],
  setupFiles: ['./setupMocks.ts']
};
