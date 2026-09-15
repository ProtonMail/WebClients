# Standalone Sheet

From the repository root, using the checkout's installed workspace dependencies:

```sh
yarn workspace proton-docs-editor standalone-sheet
```

Open <http://127.0.0.1:8090/>. No Docs shell, login, Drive, API, or RTS process is needed.
To run another worktree or another instance alongside it:

```sh
yarn workspace proton-docs-editor standalone-sheet --port 8091
```
