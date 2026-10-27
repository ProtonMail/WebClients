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
The outline (table of contents) shows once the document has headings. Its heading links point at this page with `?headingKey=…`.
The harness supplies local Docs dependencies directly, including the in-memory comments client and awareness subscriptions.
It loads no Proton styles, only Tailwind (`standalone-doc.tailwind.scss`) and the editor's own tokens in `Containers/Docs/docs.scss`, so a Proton class in `Containers/Docs` shows up here as missing styling.
`standalone-doc.css` sets the same tokens on `.app-root` for what renders outside `.docs-editor-root`: the header and `DocsLayoutContainer`.

`StandaloneDocsEditor` needs no Proton providers, styles or translations, only a surrounding `DocsDependenciesProvider`.
It does not require application, editor-state, or notification providers, or create a parent bridge or network transport.

Messages: pass a complete, translated `DocsMessages` object as `dependencies.messages` to localize the UI.
`dependencies.defaultMessages` is the fallback when neither `messages` nor an outer `DocsDependenciesProvider` supplies one.
The demo passes only the English `defaultDocsMessages` as `defaultMessages`, and loads no ttag locale.

Theme: the editor's tokens are light by default and switch to dark when an ancestor has `data-theme-mode="dark"`.
The demo's `EditorThemeProvider` sets it on `<html>` from the header's theme menu or `?theme=dark`; a host only picks the mode.
The in-memory document is preserved when the page enters the browser's back/forward cache and disposed on exit or unmount.
Do not enable `STANDALONE_DOC` and `STANDALONE_SHEET` together.
