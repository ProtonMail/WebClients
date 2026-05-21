# Public surface of `@proton/drive`

This folder is the stable, external entry point of the `@proton/drive` package. It is meant to be consumed **only by projects outside of `applications/drive`** (for example `applications/docs`, `applications/mail`, etc.).

## Rules

- **External applications**: import from `@proton/drive/public/*` only. Do not reach into `modules/`, `components/`, or `internal/` - those are not part of the public contract and may change without warning. Linter will enforce this.
- **`applications/drive`**: must **not** import from `@proton/drive/public/*`. It is the owner of the drive code and should consume the internal entry points (`@proton/drive/modules/*`, `@proton/drive/components/*`, etc.) directly. Importing from `public/` from inside `applications/drive` would add a pointless redirection.
