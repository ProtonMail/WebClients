# Glossary

Domain and architecture terms for Proton Docs and Sheets, covering the client (`applications/docs`), the editor (`applications/docs-editor`) and their packages. Paths are relative to the repo root; `core` = `packages/docs-core/lib`, `shared` = `packages/docs-shared/lib`, `editor` = `applications/docs-editor/src/app`, `app` = `applications/docs/src/app`.

When a term has more than one meaning in code, the **Ambiguous** note says which one to use in new code.

## Documents and identity

- **Document**: any Docs file, text or spreadsheet. When the distinction matters, say **text document** or **sheet**.
  - **Ambiguous**: code also uses "document" for the text kind only. Two type names exist for the kind: `DocumentType` (`'doc' | 'sheet'`, `shared/BasicTypes.ts`) and the newer `ProtonDocumentType` (`'document' | 'spreadsheet'`, `packages/shared/lib/helpers/mimetype.ts`). A TODO plans to rename the former to the latter; `tmpConvertOldDocTypeToNew` / `tmpConvertNewDocTypeToOld` translate between them.
- **Sheet / spreadsheet**: a Proton Sheets document. Drive marks it with MIME type `application/vnd.proton.sheet` (text documents: `application/vnd.proton.doc`); check with `isProtonDocsSpreadsheet` / `isProtonDocsDocument`.
- **Node / link**: a document is a Drive node, also called a link. `linkId` identifies it within a volume (`volumeId`).
- **`NodeMeta`**: `{ volumeId, linkId }`, identifies a node in the private (logged-in) context. `shared/BasicTypes.ts`.
- **`PublicNodeMeta`**: `{ token, linkId }`, identifies a node opened through a public share link (`token` is the share URL token). `AnyNodeMeta` is the union; tell them apart with `isPublicNodeMeta` / `isPrivateNodeMeta`. `shared/NodeMetaHelpers.ts`.
- **`nodeUid`**: the Drive SDK's single-string node id, built from `volumeId` + `linkId` (`generateNodeUid` / `splitNodeUid`). `core/DriveSDK/`.
- **`DocumentMeta`**: the Docs API `/meta` response: commit ids, volume id, timestamps. `core/Models/DocumentMeta.ts`.
- **`DecryptedNode`**: the decrypted Drive node (name, MIME type...). `shared/DecryptedNode.ts`.

## Apps and contexts

- **Docs homepage**: the page listing documents (recents, owned by me, shared with me, trash). `app/routes/(user)/(homepage)/`.
- **Document viewer** (`DocumentViewer`): the shell UI around one document. Hosts the editor iframe and the header (title, sharing, history). `app/components/document/DocumentViewer/`.
- **User app / public app**: the two root components. `PublicApp` renders when the URL `mode` is `open-url` or `open-url-download`, otherwise `UserApp`. `app/index.tsx`, `app/routes/(user)/`, `app/routes/(public)/`.
- **Public vs private**: whether the document was opened through a public share link. Three splits exist in code:
  - `ProviderType` (`'private' | 'public-authenticated' | 'public-unauthenticated'`), `app/provider-type.ts`: separates logged-in from anonymous public viewers.
  - Compat type / `isPublicMode` (`'private' | 'public'`): docs-core's split, picks `DocLoader` vs `PublicDocLoader`.
  - User app vs public app: decided by URL `mode`.
- **`DocumentAction`**: the intent parsed from the URL `mode` (`open`, `convert`, `download`, `history`, `new`, `open-url`...). `shared/DocumentAction.ts`.
- **`RedirectAction`**: what to resume after a public viewer signs in (`Bookmark`, `MakeCopy`). `shared/DocumentAction.ts`.
- **Bookmark**: a signed-in user saving a publicly shared document to their account. Comes from drive-store's `useDocsBookmarks`; Docs has no bookmark model of its own.
- **Local ID**: the standard Proton account session index (the `/u/{n}` URL segment), from `getLocalID`. Not Docs-specific.

## Client and editor split

- **Client**: `applications/docs`, the parent window.
- **Editor / editor sandbox / editor iframe**: `applications/docs-editor`, loaded in a sandboxed iframe. It renders text documents with **Lexical** and sheets with **rowsncolumns** (`@rowsncolumns/*`).
- **Bridge**: the `postMessage` RPC between client and editor. `ClientToEditorBridge` (`core/Bridge/`) lives in the client; `EditorToClientBridge` (`editor/Bridge/`) lives in the iframe and rejects messages from anywhere but the parent. The method contracts are `ClientRequiresEditorMethods` and `EditorRequiresClientMethods` (`shared/Bridge/`). The editor cannot reach Unleash, the API or Drive directly; it asks the client over the bridge.
  - **`ClientInvoker`** (`editor/Bridge/ClientInvoker.ts`): the editor's side of `EditorRequiresClientMethods`; turns calls into messages and matches replies by `messageId`.
  - **`EditorInvoker`** (`core/Bridge/EditorInvoker.ts`): the client's side of `ClientRequiresEditorMethods`.
  - **`EditorToClientRequestHandler`** (`core/Bridge/`): answers editor calls in the client, delegating to `EditorOrchestrator`. Its editor-side counterpart is the `requestHandler` object in `editor/Containers/App.tsx`.
  - **`BridgeOriginProvider`** (`shared/Bridge/`): the expected client and editor origins, used as every `postMessage` target.
- **`SyncedEditorState`**: properties the client mirrors into the editor (`userName`, `suggestionsEnabled`, `receivedEverythingFromRTS`...). `shared/State/SyncedEditorState.ts`.
- **`EditorSystemMode`** (`Edit`, `Revision`, `PublicView`): the presentation mode, set by context, not the user. `shared/EditorSystemMode.ts`.
- **`EditorUserMode`** (`Edit`, `Preview`, `Suggest`): the mode the user picks, limited by the system mode. `editor/Containers/Docs/contract/EditorUserMode.ts`.
  - **Ambiguous**: `EditorSystemMode.Edit` and `EditorUserMode.Edit` are different values. `EditorInitializationConfig.mode` (`creation` / `conversion`) and `DocumentAction` `mode` are unrelated to both.

## Editor architecture

- **Host shell**: the editor code outside the standalone editors (`editor/Bridge/`, `editor/Lib/`, `editor/Containers/App.tsx`). It knows about the client and the bridge.
- **Standalone editor**: `StandaloneDocsEditor` (`editor/Containers/Docs/`) and `StandaloneSheetsEditor` (`editor/Containers/Spreadsheet/`), the host-independent editors. `src/standalone-doc` and `src/standalone-sheet` run them on localhost without the client, bridge or RTS.
- **Adapter** (`DocsAdapter` / `SheetsAdapter`, `editor/Containers/adapters/`): the boundary that turns the bridge, the editor `Application` and synced state into a standalone editor's dependencies.
- **`DocsDependencies` / `SheetsDependencies`**: everything host-provided that a standalone editor uses (logger, `reportError`, comments, flags, messages...), read with `useDocsDependencies()` / `useSheetsDependencies()`.
- **`public.ts` / `contract/`**: a standalone editor's export surface, and the host-facing types copied into it so it doesn't depend on docs-shared or docs-core.

### Lexical (text documents)

- **Plugin**: a React component inside the Lexical composer that registers listeners and commands on the editor. `editor/Containers/Docs/Plugins/`.
- **Command**: a typed event created with `createCommand('X_COMMAND')` and handled with `editor.registerCommand`.
- **Node**: a Lexical node class; its `getType()` string is how saved documents refer to it. All nodes are listed in `AllNodes` (`editor/Containers/Docs/AllNodes.ts`).
- **`$` function**: Lexical's naming for functions that must run inside `editor.update()` / `editor.read()` (`$createProtonNode`).
- **`CommentThreadMarkNode` / mark node**: the node (`'comment-thread-mark'`) wrapping the text a comment thread refers to. `editor/Containers/Docs/Plugins/Comments/`.
- **`MarkNodeMap`**: map from comment or suggestion id to the keys of its nodes; drives hover and active state. `editor/Containers/Docs/Plugins/MarkNodesContext.tsx`.
- **`*AsSuggestion` operations**: suggestion-mode versions of edits (`formatTextAsSuggestion`, `setBlocksTypeAsSuggestion`...). `editor/Containers/Docs/Plugins/Suggestions/`.

### rowsncolumns (sheets)

- **`SheetsMessages`**: the typed catalogue of every Sheets UI string (`typeof defaultSheetsMessages`), translated in the adapter and read with `useSheetsMessages()`. `editor/Containers/Spreadsheet/messages/`.
- **Sheets patch** (`Base` / `Delta` / `Drifted`): spreadsheet changes the editor sends to the client for local storage (`storeSpreadsheetPatches`); stored by `SheetsStorageService` in IndexedDB. `editor/Containers/Spreadsheet/contract/SheetsPatch.ts`.
- **Yjs drift**: local spreadsheet state that no longer matches the Yjs document, found by the local update audit. `editor/Containers/Spreadsheet/yjs-local-update-audit.ts`.
- **`SheetsAction`**: named spreadsheet actions (`FreezeRows`, `SetLocale`...) recorded through `storeSpreadsheetAction`. `editor/Containers/Spreadsheet/contract/SheetsAction.ts`.

## docs-core architecture

- **`Application`** (docs-core): the library's entry point, built by the client in `useInitializeApplication` and provided via `ApplicationProvider` / `useApplication()` (`app/utils/application-context.tsx`). The client uses only `ApplicationInterface`. `core/Application/Application.ts`.
  - **Ambiguous**: docs-editor has an unrelated `Application` class (`editor/Lib/Application.ts`) holding the iframe's own state. Say "docs-core `Application`" or "editor `Application`".
- **Service vs controller**: a service manages many resources or varied inputs (`WebsocketService`, `EncryptionService`, `MetricService`); a controller manages exactly one document (`AuthenticatedDocController`, `RealtimeController`, `EditorController`, `CommentController`).
- **`AuthenticatedDocController`**: lifecycle of one document for a logged-in user: squash triggering, duplicate, trash/restore. Its events are `DocControllerEvent` and fields holding it are often named `docController`; no class is named `DocController`. `core/AuthenticatedDocController/`.
- **`RealtimeController`**: connects one document to the websocket service: incoming DUs, initial sync timeout, stale-commit refetch. `core/RealtimeController/`.
- **`EditorController`**: docs-core's handle on the editor (export, apply updates, restore revision). `core/EditorController/`.
- **`EditorOrchestrator`**: the single interface the bridge uses to reach docs-core, so the editor never touches services or controllers directly. `core/Services/Orchestrator/`.
- **`DocLoader` / `PublicDocLoader`**: load one private / public document and wire up its controllers. `core/Services/DocumentLoader/`.
- **Use case**: a single-purpose class with `execute()` returning `Result<T>` or `Promise<Result<T>>` (`LoadDocument`, `SquashDocument`, `SeedInitialCommit`...). Interfaces in `core/Domain/UseCase/`, implementations in `core/UseCase/`.
- **`Result<T>`**: success-or-error return type (`Result.ok` / `Result.fail`). `shared/Result.ts`.
- **`DocumentState`**: docs-core's per-document observable store (role, base commit, meta, realtime flags). `core/State/DocumentState.ts`.
  - **Ambiguous**: `DocState` (`shared/Doc/DocState.ts`) is a different thing: the editor-side wrapper around the Yjs document.
- **`InternalEventBus`**: in-process pub/sub (`application.eventBus`). `shared/Events/InternalEventBus.ts`.

## Data, sync and encryption

- **Yjs**: the CRDT library behind collaboration. A document's content is a `Y.Doc`; changes are Yjs updates.
- **DU (document update)**: one encrypted Yjs update, the unit sent to and from the server. Protobuf `DocumentUpdate` (`packages/docs-proto`); decrypted it becomes a `DecryptedMessage`.
  - **Ambiguous**: depending on the layer the same thing is called DU, update, `DocumentUpdate`, message, or `DecryptedMessage`. Say DU.
- **Commit**: the server-persisted list of DUs for a document. The latest one loaded at open is the **base commit** (`DocumentState.baseCommit`); live DUs apply on top. `core/Models/DecryptedCommit.ts`.
- **Squash**: merging a commit's DUs into fewer updates once it exceeds a per-type DU limit (`GetCommitDULimit`). Flow: lock (`SquashLock`), verify, squash, upload, unlock. `core/UseCase/SquashDocument.ts`.
  - **Ambiguous**: "lock" means the server-side squash lock (`lockId`) here, but `lockEditor` / `realtimeIsLockedDueTo*` mean the editor is read-only. Unrelated.
- **Seed initial commit**: creating a document's first commit directly (used by duplicate). `core/UseCase/SeedInitialCommit.ts`.
- **RTS**: the Real-Time Server. The client connects over websockets (`WebsocketService`, `core/Services/Websockets/`) using a realtime token (API route name: "valet token"). **`receivedEverythingFromRTS`** means the initial sync finished.
- **Conversion**: importing a non-native file (`DocsConversionType`: docx, odt, md, xlsx, csv...) into a new document. An empty document is created (`CreateEmptyDocumentForConversion`), then the editor converts the content.
- **AAD**: additional authenticated data bound to each encrypted DU or comment. `core/UseCase/GetAdditionalEncryptionData.ts`.
- **Drive compat / Drive SDK**: two paths for Drive operations. `DriveCompat` / `PublicDriveCompat` (`packages/drive-store`) is the legacy path; `@proton/drive` (`core/DriveSDK/`, `app/drive-sdk/`) is the new one, rolled out behind the SDK flags listed in `app/utils/flags.ts`.

## Collaboration

- **Role**: a user's permission on a document (`DocumentRole`: `Viewer`, `Commenter`, `Editor`, `Admin`, `PublicViewer`, `PublicEditor`...). Check capabilities with its methods (`canEdit()`, `canComment()`, `canShare()`...). `shared/Doc/DocumentRole.ts`.
- **Comment thread**: `CommentThreadType` is `Comment` or `Suggestion`. Comment threads are `Active` or `Resolved`; suggestion threads are `Active`, `Accepted` or `Rejected`. `shared/CommentThread*.ts`.
- **Suggestion mode**: editing where changes become suggestions others accept or reject (`EditorUserMode.Suggest`). Suggested content is wrapped in `ProtonNode` (`editor/Containers/Docs/Plugins/Suggestions/`); saved documents depend on it.
- **Live comments**: who is currently typing in each comment thread, broadcast over RTS. `core/Realtime/LiveComments/`.
- **Version history**: past revisions, built by grouping DUs (`core/VersionHistory/`), shown in `HistoryViewerModal`.
