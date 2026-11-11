# Homepage

The purpose of this module is to provide a dependency-free implementation of Docs homepage. To achieve this goal, code duplicates are allowed. No code from outside of this path should be imported (unless it's a shared package). Legacy paths (drive-store) will NOT be ported here.

The module never imports `@proton/docs-shared` or `@proton/docs-core`, in types, tests and mocks too.

Files inside this path import each other with relative paths, never through the `~/homepage` alias.

Drive SDK: the `ProtonDriveClient` instance (from `getDrive`) is injected by the host. Everything else (functions, enums, error classes, types) is imported from `@protontech/drive-sdk`, never from `@proton/drive`.

Files outside this path import only from its public entry, `index.ts` (`~/homepage`), never from deeper paths. Code needed on both sides is duplicated.
