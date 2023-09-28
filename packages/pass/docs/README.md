# Proton Pass Documentation

Documentation for proton pass web clients

### File structure

```bash
├── applications
│   ├── pass-extension # extension codebase
├── packages
│   ├── pass  (@proton/pass) # shared code
```

### Conventions

##### VSCode settings

Add the following properties to your `settings.json`

```json
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
```

##### Best practices

-   Prefer named exports & avoid index file re-exports
-   Specify `import type { ... }` or `import { type ... }` when importing types
-   Use `FC` utility type from react to explicitly type components & `VFC` for children-less components
-   When using React Context, ensure its responsibilities are well defined & the implementation is correct in regards to having a stable context value or memoized according to its dependencies
-   Create hooks when composing data from context and/or redux for use in UI components.
