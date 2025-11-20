These package declares global types that need to be available throughout the monorepo.

All workspaces automatically depend on the package, so it does not need to be added to any `package.json` .

The type dependency is also included in `tsconfig.base.json`.

However, if a workspace's `tsconfig.json` is re-declaring `compilerOptions.types`, you'll need to manually include `"global-types-monorepo"` in the list.