# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported (unless it's a shared package). Legacy paths (drive-store) will NOT be ported here.

Files inside this path import each other with relative paths, never through the `~/homepage` alias. Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths.

Drive SDK: the `ProtonDriveClient` instance (from `getDrive`) is injected by the host. Everything else (functions, enums, error classes, types) is imported from `@protontech/drive-sdk`, never from `@proton/drive`.

The host injects values and functions, never hooks.

Strings: only `messages/` imports ttag. Each area has a `create<Area>Messages()` function there, which a component or helper calls when it needs the strings, so ttag runs after the locale has loaded. Keep a moved string's context, msgid and parameter names, which existing translations match.

It reads no feature flags itself (no `~/utils/flags` or `@proton/unleash`): the host resolves the ones it needs into `featureFlags`.

UI components are built with Ariakit and Tailwind in `components/`, copied from the realtime repo's editors or, where they have none, from Proton.
