module.exports = {
    root: true,
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
    },
    ignorePatterns: ['.eslintrc.js'],
};
