# Standalone Docs

From the repository root, using the checkout's installed workspace dependencies:

```sh
pnpm --filter proton-docs-editor run standalone-doc
```

Open <http://127.0.0.1:8091/>. No login, Docs parent iframe, Drive, API, or RTS process is needed.
The Markdown fixture is imported through the real Docs editor into an in-memory `DocState`.
Reloading resets the document. The header lets you switch between editing, suggesting and viewing and between light and dark themes.
You can also start with <http://127.0.0.1:8091/?theme=dark>.

To run another worktree or instance alongside it:

```sh
pnpm --filter proton-docs-editor run standalone-doc --port 8092
```

Comments and suggestions work for the single local user: threads, replies, edits, deletes, resolving,
and suggestions you make in Suggest mode and accept or reject live in page memory and reset on reload, like the document.
There are no other users, so no typing indicators, unread threads, or comments from collaborators.
Host file operations are unavailable.
The harness supplies local Docs dependencies directly, including the in-memory comments client and awareness subscriptions.

`StandaloneDocsEditor` requires a surrounding `DocsDependenciesProvider`. Supply a complete `DocsMessages`
object via `dependencies.messages` to localize the UI, and use `dependencies.defaultMessages` to supply
fallback messages. The demo supplies the English `defaultDocsMessages`.

It does not require application, editor-state, or notification providers, or create a parent bridge or network transport.
The in-memory document is preserved when the page enters the browser's back/forward cache and disposed on exit or unmount.
Do not enable `STANDALONE_DOC` and `STANDALONE_SHEET` together.
