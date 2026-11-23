# docs-homepage-standalone

A standalone host for the Docs homepage module (`applications/docs/src/app/homepage`). It mounts the module with empty mocks (no documents, no invitations, no real Drive), so a developer can check that the module opens on its own.

Developers only: it is never built, deployed or shipped, and it is not reachable by users.

```sh
pnpm --filter docs-homepage-standalone start   # http://localhost:8098/recents
```

Not interactive on purpose: the lists are empty and actions do nothing. Make a mock return data in `src/main.tsx` when you need a case.
