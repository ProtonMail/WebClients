module.exports = {
    setupFilesAfterEnv: ['./rtl.setup.js'],
    verbose: true,
    moduleDirectories: ['node_modules'],
    transform: {
        '^.+\\.(js|tsx?)$': 'babel-jest'
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
        pmcrypto: '<rootDir>/__mocks__/pmcrypto.js',
        'sieve.js': '<rootDir>/__mocks__/sieve.js'
    },
    transformIgnorePatterns: ['node_modules/(?!(proton-shared)/)']
};
