module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        projectService: true,
    },
    ignorePatterns: ['.eslintrc.js'],
};
