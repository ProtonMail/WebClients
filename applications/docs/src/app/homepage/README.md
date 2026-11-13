# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported (unless it's a shared package). Legacy paths (drive-store) will NOT be ported here.

The module never imports `@proton/docs-shared` or `@proton/docs-core`, in types, tests and mocks too.

It never imports `@proton/shared`, `@proton/utils`, `@proton/hooks`, `@proton/payments-ui` or `@proton/account` either. It keeps its own copies of their helpers, such as `utils/clsx.ts` and `utils/mimetype.ts`. What needs host state is injected through `HomepageViewProvider`'s props, such as the API, logger, telemetry, notifications, `getAppHref` with the user's local ID, the date locale, error tracking (Sentry), feature flags and the user's addresses and contacts.

The host injects values and functions, never hooks. It runs its own hooks and passes what they return: the pending invitations and the functions that accept, decline and reload them through `HomepageViewProvider`, and the functions that open the share and move modals through `DocumentActionsProvider`. The host renders those modals itself.

The host loads the invitations when the homepage opens and keeps them current. The module reloads them only from the sidebar's reload button, not when it shows the invitations table again.

It reads no feature flags itself (no `~/utils/flags` or `@proton/unleash`): the host resolves the ones it needs into `featureFlags`. Sheets is always enabled; the module ignores the `DocsSheetsDisabled` kill switch.

UI components are built with Ariakit and Tailwind in `components/`, copied from the realtime repo's docs-editor: `atoms.tsx` styles them and `ui.tsx` adds their Ariakit behaviour. Use the `Button`, `IconButton` and `Tooltip` of `components/ui.tsx`, never `@proton/atoms`' `Button` or `Tooltip`. `HomepageStyleScope`, rendered by `HomepageLayout`, roots the module's Ariakit portals, as the editors' style scopes do.

Files inside this path import each other with relative paths, never through the `~/homepage` alias.

Drive SDK: the `ProtonDriveClient` instance (from `getDrive`) is injected by the host. Everything else (functions, enums, error classes, types) is imported from `@protontech/drive-sdk`, never from `@proton/drive`.

Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths. Code needed on both sides is duplicated.
