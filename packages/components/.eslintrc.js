module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    env: {
        jasmine: true,
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    rules: {
        'react/button-has-type': ['warn'],
        'react/forbid-prop-types': ['warn'],
        'react/no-array-index-key': ['warn'],
        'jsx-a11y/no-static-element-interactions': ['warn'],
        'jsx-a11y/control-has-associated-label': ['warn'],
        'jsx-a11y/click-events-have-key-events': ['warn'],
        'jsx-a11y/anchor-is-valid': ['warn'],
        'jsx-a11y/label-has-associated-control': ['warn'],
        'jsx-a11y/no-noninteractive-tabindex': ['warn'],
        'jsx-a11y/no-noninteractive-element-interactions': ['warn'],
        'jsx-a11y/no-noninteractive-element-to-interactive-role': ['warn'],
    },
    ignorePatterns: ['.eslintrc.js'],
};
