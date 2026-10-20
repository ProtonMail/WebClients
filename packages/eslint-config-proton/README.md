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

## Restricted imports

All restricted imports live in `restrictedImports.js` and are enforced by the `proton/restricted-imports` rule (never use `no-restricted-imports` directly: flat config replaces its options instead of merging them).

- **Base list** (`BASE_RESTRICTIONS`): enforced everywhere, cannot be opted out of.
- **Rollout list** (`ROLLOUT_RESTRICTIONS`): restrictions not yet clean on every client. A client opts in by id. Once every client lists an id, move it to the base list and remove the id from the client configs.
- **Client additions**: `paths` and `patterns` passed to `createRestrictedImportsConfig`.

```js
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    createRestrictedImportsConfig({
        rollout: ['components-barrel', 'icon-component'],
        patterns: [{ group: ['@proton/foo/*'], message: 'Only the entry point is public.' }],
    }),
]);
```
