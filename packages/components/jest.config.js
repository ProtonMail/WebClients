module.exports = {
    setupFilesAfterEnv: ['./rtl.setup.js'],
    verbose: true,
    moduleDirectories: ['node_modules', 'node_modules/proton-shared'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
        pmcrypto: '<rootDir>/__mocks__/pmcrypto.js',
        'pm-srp': '<rootDir>/__mocks__/pm-srp.js'
    },
    transformIgnorePatterns: ['node_modules/(?!(proton-shared)/)']
};
