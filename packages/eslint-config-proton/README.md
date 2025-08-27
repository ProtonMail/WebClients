# Proton ESLint config

Modern ESLint config for a more civilized age.

## How to use

Add the following to the `package.json` dev dependencies.

```json
"@proton/eslint-config-proton": "workspace:^",
```

Then, use the following `.eslintrc` config.

```js
import defaultConfig from '@proton/eslint-config-proton/all';

export default defaultConfig;
```
