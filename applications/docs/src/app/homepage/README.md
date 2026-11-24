# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported: no `@proton/*` package and no `~/` alias of the Docs app, only third-party packages (React, Ariakit, Zustand, `@protontech/drive-sdk`). Legacy paths (drive-store) will NOT be ported here.

Files inside this path import each other with relative paths, never through the `~/homepage` alias. Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths.

Drive SDK: the `ProtonDriveClient` instance (from `getDrive`) is injected by the host. Everything else (functions, enums, error classes, types) is imported from `@protontech/drive-sdk`, never from `@proton/drive`.

The host injects values and functions, never hooks. It passes them all as one `HomepageDependencies` object to `HomepageDependenciesProvider`, which wraps the module's header, sidebar and content; the host's `HomepageAdapter` (`routes/(user)/(homepage)/__components/`) builds it, as `DocsAdapter` does for the Docs editor.

Strings: nothing here imports ttag. `messages/` holds the English defaults, one group per area, and components read them with `useHomepageMessages()`; a helper outside React takes its group as a parameter. The host translates them with ttag in `routes/(user)/(homepage)/__utils/homepageMessages/`, one `create<Area>Messages()` per group, and passes them as `HomepageDependencies.messages`. A string with a parameter or plural is a function with the same signature in both. Keep the host's context, msgid and parameter names, which existing translations match.

It reads no feature flags itself (no `~/utils/flags` or `@proton/unleash`): the host resolves the ones it needs into `featureFlags`.

UI components are built with Ariakit and Tailwind in `components/`, copied from the realtime repo's editors or, where they have none, from Proton.

Icons: nothing here imports `@proton/icons` or `@proton/file-icons`. `components/icons.tsx` holds the SVG geometry of the icons it uses, copied from `@proton/icons` (camelCase names, alphabetical order), drawn with `<Icon data={Icons.x} />` from `components/Icon.tsx`; `components/FileTypeIcon.tsx` draws the Docs and Sheets file icons. To add an icon, copy its paths from `@proton/icons` into `icons.tsx`.

Lint (`proton/restricted-imports` in `applications/docs/oxlint.config.mts`) enforces these rules: it rejects any `@proton/*` import (packages and subpaths, icons included), any `~/…` alias import and `ttag` in this folder. Not enforced yet: relative imports leaving the folder and Proton's global CSS classes.
