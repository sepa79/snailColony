module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  moduleNameMapper: {
    '^@snail/protocol$': '<rootDir>/../../../libs/protocol/src',
  },
};
