# Standalone Sheet

From the repository root, using the checkout's installed workspace dependencies:

```sh
pnpm --filter proton-docs-editor run standalone-sheet
```

Open <http://127.0.0.1:8090/>. No Docs shell, login, Drive, API, or RTS process is needed.
To run another instance alongside it:

```sh
pnpm --filter proton-docs-editor run standalone-sheet --port 8091
```

The demo uses an in-memory workbook; reloading resets it. File actions, remote
collaboration, and persistent storage are unavailable.

Use the header to switch between English, French, and German. Language changes
preserve workbook edits. The demo's supplemental French and German translations
are draft wording.

`StandaloneSheetsEditor` requires a surrounding `SheetsDependenciesProvider` for
host actions and session settings. Supply a complete `SheetsMessages` object via
`dependencies.messages` to localize the UI, and use `dependencies.defaultMessages`
to supply fallback messages. The demo supplies English defaults. Workbook number and date
formatting uses its own locale, independently of UI language.
