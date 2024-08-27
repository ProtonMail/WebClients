# Importer Guidelines

Importers handle data from different password managers.

## Directory Structure

```
importer/
├── helpers/
│   └── ... (common utilities)
├── providers/
│   ├── {provider-name-1}/
│   │   ├── mocks/
│   │   │   └── ... (mock files)
│   │   ├── {provider-name-1}.reader.ts
│   │   ├── {provider-name-1}.reader.spec.ts
│   │   └── {provider-name-1}.types.ts
│   ├── {provider-name-2}/
│   │   ├── mocks/
│   │   │   └── ... (mock files)
│   │   ├── {provider-name-2}.reader.ts
│   │   ├── {provider-name-2}.reader.spec.ts
│   │   └── {provider-name-2}.types.ts
│   └── ... (other providers)
└── reader.ts
└── types.ts
```

## Conventions

-   Place all importers in `packages/pass/lib/import/providers`, with each provider in its own folder.
-   Include mock files for each provider in their respective folders.
-   When exporting utility functions, include the provider name (e.g., `extractLastPassCustomFields` instead of `extractCustomFields`).
-   Define import file structures in `provider.types.ts` for each provider. Types should closely match actual data as no data-validation is implemented yet.
-   Reader functions should map raw file content to an `ImportPayload` type.

## Adding a New Import Provider

1. Define a new provider in the `ImportProvider` enum.
2. Add provider configuration to `PROVIDER_INFO_MAP` constant.
3. Add an appropriate icon in `ImportIcon.tsx`.
4. Implement the provider-specific reader function.
5. Add test cases with a custom import mock.
6. Add a case in the main `fileReader` function.
