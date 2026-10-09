# Standalone Docs

From the repository root, using the checkout's installed workspace dependencies:

```sh
pnpm --filter proton-docs-editor run standalone-doc
```

Open <http://127.0.0.1:8091/>. No login, Docs parent iframe, Drive, API, or RTS process is needed.
The Markdown fixture is imported through the real Docs editor into an in-memory `DocState`.
Reloading resets the document. The header lets you switch between editing and viewing and between light and dark themes.
You can also start with <http://127.0.0.1:8091/?theme=dark>.

To run another worktree or instance alongside it:

```sh
pnpm --filter proton-docs-editor run standalone-doc --port 8092
```

Comments, suggestions, and host file operations are unavailable. Attempts are shown in the status header.
The harness supplies local Docs dependencies directly, including comments and awareness subscriptions.
It does not require application, editor-state, or notification providers, or create a parent bridge or network transport.
The in-memory document is preserved when the page enters the browser's back/forward cache and disposed on exit or unmount.
Do not enable `STANDALONE_DOC` and `STANDALONE_SHEET` together.
