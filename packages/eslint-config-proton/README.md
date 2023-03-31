# Proton ESLint config

Modern ESLint config for a more civilized age.

## How to use

Add the following to the `package.json` dev dependencies.

```json
"@proton/eslint-config-proton": "workspace:^",
```

Then, use the following `.eslintrc` config.

```js
module.exports = {
    extends: ['@proton/eslint-config-proton'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
    ignorePatterns: ['.eslintrc.js'],
};
```
