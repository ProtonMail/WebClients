# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported (unless it's a shared package). Legacy paths (drive-store) will NOT be ported here.

The module never imports `@proton/docs-shared` or `@proton/docs-core`, in types, tests and mocks too.

It never imports `@proton/shared`, `@proton/utils`, `@proton/hooks` or `@proton/payments-ui` either. It keeps its own copies of their helpers, such as `utils/clsx.ts` and `utils/mimetype.ts`. What needs host state is injected through `HomepageViewProvider`'s props, such as the API, logger, telemetry, notifications, `getAppHref` with the user's local ID, the date locale, error tracking (Sentry) and feature flags.

It reads no feature flags itself (no `~/utils/flags` or `@proton/unleash`): the host resolves the ones it needs into `featureFlags`. Sheets is always enabled; the module ignores the `DocsSheetsDisabled` kill switch.

Files inside this path import each other with relative paths, never through the `~/homepage` alias.

Drive SDK: the `ProtonDriveClient` instance (from `getDrive`) is injected by the host. Everything else (functions, enums, error classes, types) is imported from `@protontech/drive-sdk`, never from `@proton/drive`.

Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths. Code needed on both sides is duplicated.
