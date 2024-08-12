module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './eslint.tsconfig.json',
    },
    ignorePatterns: ['.eslintrc.js', 'lib'],
};
