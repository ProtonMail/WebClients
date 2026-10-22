# Coding standards

Rules for code in `applications/docs` (the client) and `applications/docs-editor` (the editor). They apply to new and changed code; existing code that breaks them is not a reason to copy it. Terms are defined in [`GLOSSARY.md`](./GLOSSARY.md).

The shared sections apply to both apps. After them come the client-only and editor-only rules.

## Shared

### `packages/docs-core` and `packages/docs-shared`

These packages are being phased out; development happens inside the two apps.

- Use what already exists in them freely (`Result`, `DocumentRole`, the `Application`, use cases, bridge types...).
- Put new code in the app that needs it: new types, helpers, services, use cases, state and events live in `applications/docs` or `applications/docs-editor`, co-located with their callers, even when docs-core or docs-shared would look like the natural home. When both apps need the same small type, each app keeps its own copy, as the editor's `contract/` directories already do.
- Changes to existing code in the packages (bug fixes, behaviour changes) are fine; keep them to the code being changed.
- The one sanctioned extension is a new bridge method, because the bridge contract lives in these packages: add only the method itself, following the steps in [Bridge](#bridge).

### Exports

- Use named exports. The only default exports are components loaded through `React.lazy()`, and the client's `page.tsx` files.

### React components

- Declare components as named functions. Pass a named function to `forwardRef` and `memo` too (it keeps names in React DevTools).

  ```tsx
  export function MyComponent({ foo }: MyComponentProps) {
    return <div>{foo}</div>
  }

  export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
    // ...
  })
  ```

- Give every component that takes props a `<ComponentName>Props` type, exported if the component is.
- Contexts: `createContext<T | undefined>(undefined)`, a `useX()` hook that throws an error naming the missing provider, and an `XProvider` with exported `XProviderProps`. Models: `applications/docs/src/app/utils/application-context.tsx`, `applications/docs-editor/src/app/Containers/Docs/DocsDependenciesProvider.tsx`.

### Errors

- Operations that can fail return `Result<T>` from `@proton/docs-shared` (`Result.ok(value)` / `Result.fail(message)`); callers check `isFailed()` before `getValue()`. `Containers/Docs` uses its own copy (`Containers/Docs/Utils/Result.ts`) to stay host-independent.

### i18n

- Wrap every user-visible string in ttag: `` c('<Context>').t`Text` ``. Context is the string's role: `Action`, `Info`, `Title`, `Label`, `Notification`, `Error`, `Placeholder`, or a precise description (`'Recent documents table header'`).
- Define translated strings held in constants as functions, so `c()` runs at render time after the locale has loaded (a plain constant is evaluated at import and stays untranslated):

  ```ts
  const label = () => c('Action').t`Text`

  const labels = {
    a: () => c('Label').t`a`,
    b: () => c('Label').t`b`,
  }
  ```

- Use `.jt` to embed JSX and `c(...).ngettext(msgid`...`, ...)` for plurals.

### Styling

- Style with Tailwind utilities plus Proton design-system classes (`color-weak`, `bg-norm`, `border-weak`...). Reach theme CSS variables with arbitrary values (`text-[--text-hint]`).
- Both apps' `tailwind.config.js` replace the default colour palette, so stock Tailwind colours (`bg-red-500`) do not exist. Use design-system classes or CSS variables for colour.
- Use SCSS only when Tailwind cannot express the style.

### Tests

- Name new tests `*.test.ts(x)` and place them next to the file under test. Older editor tests use `*.spec.ts`; leave them as they are.
- Use `@testing-library/react` (`render`, `renderHook`, `waitFor`). Provide contexts with a `wrapper` component; reset zustand stores with `setState` in `afterEach`. Model: `applications/docs/src/app/drive-sdk/useDocInvites.test.tsx`.
- Avoid mocking what can be used directly

### General

- Simple, flat, idiomatic modern TypeScript over clever abstractions.
- Full, descriptive, but not too long names.
- Names say _what_ code does; comments carry only what the name can't: the _why_, a constraint, a gotcha. A comment that restates or paraphrases the name (`// Adds two numbers` above `addNumbers`) gets deleted, and a function needing a comment to explain what it does gets a better name instead.

  A comment worth keeping, from `applications/docs-editor/src/app/Containers/App.tsx`:

  ```ts
  /**
   * Remove comment marks if we are in system presentation mode.
   * Do not remove for UserMode, since once we remove them, we can't add them back once they back into edit mode.
   */
  ```

- Leave code better than you found it: when behaviour changes, update the names, comments and docs it touches, including `GLOSSARY.md` and this file.

### Complexity

- **Flat control flow.** Handle edge cases first with guard clauses and early returns. When nesting remains after that, extract the inner block into a named function.
- **One level of abstraction per function.** A function either orchestrates (calls named steps in order) or does one step's detail; mixing the two in one scope is the signal to extract.

  ```ts
  async function openDocument(nodeMeta: NodeMeta) {
    const meta = await fetchDocumentMeta(nodeMeta)
    if (meta.isFailed()) {
      return meta
    }
    const commit = await loadLatestCommit(meta.getValue())
    return applyCommitToEditor(commit)
  }
  ```

- **Functions do one thing.** If describing a function needs "and", or its body has section comments, split it at those seams.
- **Split files by reason to change, not by length.** A long file of closely related code is fine; a file holding code that changes for different reasons gets split, following co-location.
- **Prefer pure functions.** Compute from arguments and return a value. Keep side effects (API and bridge calls, store writes, logging) at the edges, in hooks, effects, event handlers and use cases, and pass their results into pure helpers. The pure helpers are what unit tests target.

## Client (`applications/docs`)

### Files and structure

- **Co-location**: code that changes together lives together.
  1. Used in one place: keep it in that file or next to it.
  2. Used in several places: move it to the closest shared directory.
  3. Used everywhere: move it to a top-level directory like `src/app/components/`.
- Name files and directories in `camelCase` (`useRecentsStore.ts`). Exception: a file whose main purpose is exporting one React component or class takes its name (`DocumentToolbar.tsx`). Older kebab-case names exist; use camelCase for new ones and when renaming.
- Group by purpose (`utils/auth.ts`), not by kind (`hooks/`). `components/` is the one allowed kind-named directory.
- Keep the tree flat: few categories, little nesting.
- Import across the app with the aliases in `tsconfig.json` (`~/components/*`, `~/utils/*`, `~/drive-sdk/*`, `~/redux-store/*`, `~/config`). Adding an alias means adding it to both `tsconfig.json` and `jest.config.ts` `moduleNameMapper`.

### Routes

`src/app/routes/` mirrors URL paths, inspired by file-based routers (routing itself is configured with `react-router-dom`).

- A directory is a URL path segment: `routes/foo/bar/` is `/foo/bar`.
- `(name)/` groups routes without adding a path segment. `routes/(user)/` and `routes/(public)/` are the user and public apps on the same URLs.
- `__name/` holds files local to that route or group: `__components/` for components, `__utils/` for everything else.
- `page.tsx` is a route entrypoint and default-exports its page component.

### docs-core and state

- Reach existing docs-core functionality through `useApplication()` and only what `ApplicationInterface` exposes.
- Subscribe to docs-core events with `application.eventBus.addEventCallback(...)` inside a `useEffect`, returning the unsubscribe function as the cleanup.
- Local or feature state: a zustand store in a `use<Name>Store.ts` file. Redux holds only the shared Proton account reducers; leave Docs state out of it.

### Logging and tracing

- Log with `application.logger` (`info` / `warn` / `error` / `debug`). Lint allows only `console.warn`, `console.error` and `console.trace`.
- Trace boot and load steps with `void OpenTracer.trace('snake_case_event', {...})` (from `@proton/docs-shared/Tracer/Module`), prefixing the event name with its area (e.g. `boot_docs_url_bar_*`).

### Feature flags

- Wrap each Unleash flag in a named hook in `src/app/utils/flags.ts` (`useIsXEnabled`, `useXWithSDK`) and call the hook, so every flag the client reads is listed in one file.
- When a flag depends on another, record it in the dependency comment at the top of `flags.ts`.

### Styling

- Combine classes with `clsx` from `@proton/utils/clsx`.

## Editor (`applications/docs-editor`)

### Layout and boundaries

The editor has three layers. Each change belongs in exactly one:

- **Host shell** (`src/app/` outside `Containers/Docs` and `Containers/Spreadsheet`): the bridge, the editor `Application`, `Containers/App.tsx`. It knows about the client.
- **Adapters** (`Containers/adapters/docs/`, `Containers/adapters/sheets/`): turn the bridge, the editor `Application` and synced state into `DocsDependencies` / `SheetsDependencies`. This is where translated strings, feature flags and client calls are wired in.
- **Standalone editors** (`Containers/Docs/`, `Containers/Spreadsheet/`): host-independent. They read everything host-provided through `useDocsDependencies()` / `useSheetsDependencies()`, expose their API to the rest of the app only through `public.ts`, and keep host-facing types in their own `contract/` directory.

Rules that follow:

- In the standalone editors, imports stay inside the directory: no `@proton/*`, no `ttag`, no `ClientInvoker`, no editor `Application`. `Containers/Spreadsheet` is fully clean; `Containers/Docs` is still being migrated, so add no new host imports there. Check with `pnpm --filter proton-docs-editor docs:scan-imports` / `sheets:scan-imports`.
- A new host capability (a client call, a flag, a setting) goes into the `DocsDependencies` / `SheetsDependencies` type and is supplied by the adapter.
- When a standalone editor and its consumer (the adapter or host shell) need the same type, define it once in the standalone editor's `contract/`, export it from `public.ts`, and import it from there in the consumer.
- When a `contract/` type mirrors one in `packages/docs-shared` (e.g. `SuggestionType`), change both together.
- Use relative imports; the editor has no path aliases.
- Name files and directories in `camelCase`, as in the client. Files whose main purpose is exporting one component, class or Lexical node take its name in PascalCase (`ProtonNode.ts`). Older kebab-case and PascalCase directories exist (`Containers/`, `adapters/sheets/utils/use-sheets-feature-flags.ts`); use camelCase for new ones and when renaming.
- Icons come from `Containers/Docs/Components/icons` / `Containers/Spreadsheet/components/icons`; lint enforces it.

### Bridge

- Adding an editor → client method:
  1. `packages/docs-shared/lib/Bridge/EditorRequiresClientMethods.ts`
  2. `src/app/Bridge/ClientInvoker.ts`
  3. `packages/docs-core/lib/Bridge/EditorToClientRequestHandler.ts`, delegating to `EditorOrchestrator` (+ its interface). Keep the method a thin pass-through; any new logic behind it lives in the client.
  4. the test doubles: `Containers/adapters/docs/create-client-invoker-fixture.ts` and the mock in `Containers/App.initialization.test.tsx`
  5. expose it to the editor that needs it through its dependencies, in the adapter
- Adding a client → editor method: `packages/docs-shared/lib/Bridge/ClientRequiresEditorMethods.ts`, `packages/docs-core/lib/Bridge/EditorInvoker.ts`, then the `requestHandler` object in `Containers/App.tsx`.
- Bridge arguments cross `postMessage`, so pass plain data only.
- `postMessage` always targets `BridgeOriginProvider.GetClientOrigin()`, and incoming messages are accepted only from `window.parent`.

### Lexical (`Containers/Docs`)

- UI strings live in the typed `DocsMessages` catalogue (`messages/`); components read them with `useDocsMessages()`. To add a string, add its key to the defaults object exported next to the component and spread in `defaultDocsMessages`, and its ttag translation in `Containers/adapters/docs/docsMessages/`. Some `Containers/Docs` files still call ttag directly until they are migrated.
- A node's `createDOM` runs outside React, so it cannot read `useDocsMessages()`. Set translated DOM text from the node's decorator component instead. Model: `Plugins/PageBreak/PageBreakNode.tsx`.
- A plugin is a function component named `<Feature>Plugin` in `Plugins/<Feature>/`. It gets the editor from `useLexicalComposerContext()`, registers listeners in a `useEffect` that returns the unregister function (combine with `mergeRegister`), and returns `null` unless it renders UI. Mount it in `Containers/Docs/Editor.tsx`. Model: `Plugins/PageBreak/PageBreakPlugin.tsx`.
- Commands: `export const X_COMMAND = createCommand('X_COMMAND')`, in a `Commands.ts` next to the feature.
- Nodes: `<Name>Node.ts(x)` with `$create<Name>Node` / `$is<Name>Node`, registered in `Containers/Docs/AllNodes.ts` (the single list used by the editor, exporters and tests).
- Saved documents refer to nodes by their `getType()` string, so a node class and its type string are permanent once shipped. `ProtonNode` in particular backs every suggestion.
- Functions prefixed with `$` must run inside `editor.update()` / `editor.read()`.
- A new editing operation needs a suggestion-mode counterpart (`*AsSuggestion`, handled in `Plugins/Suggestions/SuggestionModePlugin.tsx`).
- Run user-supplied URLs through `Containers/Docs/Utils/sanitizeUrl.ts` and comment content through `Containers/Docs/Utils/SanitizeLexicalState.ts`.

### Sheets (`Containers/Spreadsheet`)

- UI strings live in the typed `SheetsMessages` catalogue (`messages/`); the grid reads them with `useSheetsMessages()`. To add a string, add its key to `defaultSheetsMessages` and its ttag translation in `Containers/adapters/sheets/sheetsMessages/`.
- Feature flags: add the flag to `SheetsFeatureFlags` and to `adapters/sheets/utils/use-sheets-feature-flags.ts`.
- Spreadsheet state goes through `useProtonSheetsState` (`state.ts`) and UI state through `ui-store.tsx`.

### Logging and styling

- Host shell: log with the editor `Application`'s `logger`. Standalone editors: use the injected `logger` and `reportError` from their dependencies.
- Combine classes with bare `clsx` inside the standalone editors, `@proton/utils/clsx` elsewhere.

## Drive SDK

- We are not allowed to import "private" code from @proton/drive e.g. @proton/drive/modules - use only what's exported for public

## Documentation

- Proton Drive: https://drive.gitlab-pages.protontech.ch/documentation/
- Drive SDK: https://drive.gitlab-pages.protontech.ch/sdk/
- REST API: https://protonmail.gitlab-pages.protontech.ch/Slim-API/
