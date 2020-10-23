module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
    transformIgnorePatterns: ['node_modules/(?!(proton-shared|react-components|mutex-browser|pmcrypto)/)'],
    transform: {
        '^.+\\.(js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': 'react-components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': 'react-components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
        'sieve.js': 'react-components/__mocks__/sieve.js',
    },
};
