module.exports = {
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  transform: {
    // process ts with ts-jest
    '^.+\\.ts?$': 'ts-jest',
    // process js with babel-jest
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
  },
  testMatch: ['**/__tests__/**/*(spec|test).[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  roots: ['<rootDir>/src'],
};
