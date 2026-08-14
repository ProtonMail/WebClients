# Artifact panel — design decisions

Working log of the product/architecture decisions made for the `create_artifact` feature, so we don't re-litigate them. Chronological; each entry is a decision + the reasoning, not a status update (see git history / commit messages for what's actually shipped).

## Invocation model: explicit trigger, not automatic detection

**Decision:** move from "Claude Artifacts"-style automatic invocation (the model decides mid-response whether content qualifies) to "Gemini Canvas"-style explicit invocation (the user opts in via a composer toolbar option before generating).

**Why:** the automatic-detection approach requires the model to correctly judge, every turn, whether content "qualifies" for the side panel — in practice this needed an explicit system-prompt nudge just to fire at all, and even then initially failed on plain writing requests ("write me an email") because the model reasoned "writing task" and "tool-worthy task" as mutually exclusive categories (see prior memory notes / live-test findings during the tag-to-tool-call migration). Explicit invocation removes the judgment call entirely for first-time creation — the user tells the model directly instead of the model guessing.

**Mechanism:** a `create_artifact` client tool that used to be injected into every request unconditionally is now gated by `resolveArtifactToolMode` (`helper.ts`), producing one of three states per outgoing turn:

- `'off'` — tool not registered. No artifact exists yet and the user hasn't opted in.
- `'create'` — the user just clicked "Create artifact" in the composer this turn.
- `'revise'` — mode isn't active, but the conversation already has an artifact.

Two matching system-prompt nudges (`ARTIFACT_TOOL_CREATE_NUDGE` / `ARTIFACT_TOOL_REVISE_NUDGE` in `llm/index.ts`) are injected conditionally based on this mode — no nudge at all when the tool isn't registered.

## Revision stays automatic; new-artifact creation does not

**Decision:** once an artifact exists anywhere in the conversation, the tool stays available for follow-up turns (`'revise'` mode) without the user re-entering Create Artifact mode. But outside of explicitly (re-)entering the mode, the model should only revise what already exists — it should not spawn a new, unrelated artifact on its own initiative.

**Why:** the artifact panel's selection-based inline-edit flow (`ArtifactInlineEdit.tsx`) sends a follow-up via `handleSendArtifactAction`, with no mode re-entry — it depends on the tool still being reachable. Requiring re-entry for every revision would break that flow and create needless friction for "make it shorter"-style follow-ups. Simultaneously, allowing the model to create unrelated new artifacts outside the mode would reintroduce the same automatic-detection guessing problem we just removed, just narrower in scope.

**Mechanism:** `resolveArtifactToolMode` derives `'revise'` purely from conversation state (`buildArtifactRegistry(messageChain)` non-empty) — no UI state threading needed, and it automatically covers the inline-edit flow for free.

## Create Artifact mode is mutually exclusive with Create Image mode

**Decision:** entering one composer mode exits the other, matching the existing Create Image UX pattern exactly (click to enter, exit chip with an X to leave).

**Why:** no clear product case for having both active at once; avoids ambiguous composer state.

## React key / duplicate-version bug: the model can call the tool more than once per turn

**Finding:** a single assistant message can contain more than one `create_artifact` tool_call block for the _same_ id — observed live when a model tried to satisfy a title-length schema constraint (2-5 words) against a much longer user-requested title, and retried within one reply. This caused a React duplicate-key warning (two `ArtifactChip`s keyed by the same `${id}-${messageId}`) and would have inflated the version-history nav with phantom intermediate attempts.

**Decision:** collapse multiple tool calls for the same id within one message into a single logical result, keeping the _last_ call's content — both in the chip renderer (`AssistantMessage.tsx`) and in the registry builder (`getToolCallArtifacts` in `artifactRegistry.ts`). This is a rendering/data-normalization fix, not a prompt fix — the underlying prompt-wording tension (long requested title vs. short schema field) is a separate, unresolved issue.

## Streaming/"loading" state: what actually drives it, and what doesn't

**Finding:** the loading chip (`ArtifactChipLoading`) is gated on the tool call's `arguments` field still being a raw, not-yet-fully-parsed JSON string. Verified live with temporary instrumentation (logging chunk count/timing per call) across multiple real calls, including ones with a few thousand characters of content, not just trivial edits: every one arrived with **zero** observed streaming chunks — the block was already fully parsed the first time the frontend ever saw it. No client-side throttling/batching suppresses this (a smoothing/pacing transform exists for plain text tokens but explicitly passes `tool_call` messages through unaffected) — this is delivery granularity from the backend/model, and for `create_artifact` specifically it appears to be atomic rather than token-streamed, at least across everything tested so far (not proven for arbitrarily large content).

**Implication:** a UI built around watching JSON parse incrementally is watching a signal that essentially doesn't occur in practice for this tool. It should not be the basis for "is this artifact ready to interact with." `ArtifactChipLoading` and any partial-JSON preview path are dead code under normal usage and were removed.

**Decision (superseded — see next section):** redefine "loading"/"pending" around message-completion state instead of JSON-parse-completeness:

- The artifact's _content_ is available almost immediately once its tool_call block parses (via `completeArtifacts`, derived straight from `message.blocks` — same timing/pattern as how `extractSearchResults` surfaces web-search results mid-generation, with no gate on message status).
- What's actually still pending until the message finishes (`message.status` gets set) is only the **registry** entry — `buildArtifactRegistry` deliberately excludes any message with `status === undefined`, i.e. the in-flight message, because the registry needs to track ordered versions/ids across the whole conversation and shouldn't bake in a version from a message that could still change.
- This was also the root cause of a distinct bug: the chip could look fully "done" and clickable as soon as its JSON parsed, before the registry caught up — clicking it opened whatever the registry fell back to (the previous version), not the new content already sitting in `completeArtifacts`.

**What shipped from that decision (later removed):**

- `ArtifactContext` gained `pendingArtifact`/`setPendingArtifact`/`openPendingArtifact` — a fully-parsed artifact whose message hasn't finished (so it isn't in `registry` yet). `AssistantMessage.tsx` pushed it on every prose chunk while the message was still generating.
- `ArtifactPanel` rendered `pendingArtifact` through the real `ArtifactContent` renderer (proper markdown/code highlighting, since the content is already valid) instead of an empty skeleton or a stale frozen view, for both fresh creation and revision of something already open.
- `ArtifactChip`'s click handler opened from `pendingArtifact` via `openPendingArtifact()` when the registry doesn't have a version index yet, instead of the old stale-fallback `openArtifact(id)`.

**Explicitly reverted:** a first attempt also added a visible "Finalizing…" + `CircleLoader` treatment on both the chip and panel header for this pending state. Removed after a follow-up conversation revealed it was solving a different problem than the one being asked about (a per-message "this call revised vs. created the artifact" indicator, not a generation-in-progress indicator). The underlying `pendingArtifact` correctness fix above was shipped briefly but then removed entirely — see next section.

## Provisional registry overlay: early open without polluting finalized history

**Decision:** overlay **provisional** versions from in-flight assistant messages onto the finalized registry, instead of a separate `pendingArtifact` state or a disabled chip while waiting for message finish.

**Why:** once the `create_artifact` tool call parses, the artifact content is complete and stable — only registry bookkeeping waits on message finalization. Users should be able to open and read the panel immediately. The previous `pendingArtifact` path caused close/auto-open bugs and panel re-render storms; a registry overlay keeps one code path for chip, panel, and version navigation.

**Mechanism:**

- **`buildArtifactRegistry`** — unchanged; only finalized assistant messages (`status !== undefined`).
- **`mergeProvisionalArtifactRegistry`** — adds `provisional: true` versions from in-flight messages with complete tool calls. Same `messageId` updates in-place; drops automatically when the message finalizes (picked up by the finalized build instead).
- **`useArtifactRegistry`** — returns merged registry. Recomputes on finalized message-id changes or in-flight artifact fingerprint changes (`getInFlightArtifactFingerprint`), not on every prose token.
- **`ArtifactChip`** — Open enabled as soon as provisional version exists. Normal default/active/superseded states.
- **`ArtifactPanel`** — reads from merged registry and renders full content immediately (markdown/code highlighting, same as finalized). Copy, download, and version nav are available as soon as the tool call parses — the content is complete; there is nothing to "prepare." **Inline edit alone** stays disabled until finalize (`isSelectedVersionProvisional`), silently — no spinner or status label, since sending a selection-based revision against an unfinalized version is the only action that actually depends on message completion.
- **Auto-open** — fires when the tool call first lands (provisional version appears), once per message, respecting `panelUserClosed`.

**No loading indicator on provisional versions:** a brief attempt added "Preparing…" / "Finalizing…" + `CircleLoader` on the panel header (and earlier, on the chip). Removed — the same reasoning as the earlier `pendingArtifact` revert applies: once the tool call parses, content is atomic and fully readable; a generation-style indicator misleads users into thinking the artifact itself is still arriving. Message-level loading in the chat (avatar/thinking) already covers "assistant still writing prose." Provisional is a registry bookkeeping flag, not a content-readiness signal.

**UX summary:**

| Phase | Chat | Panel |
| --- | --- | --- |
| Message generating, no tool call yet | Avatar/thinking (message loading) | Closed |
| Tool call lands (message still generating) | Chip visible, **Open** enabled | Auto-opens (unless user closed); full content readable; copy/download enabled; inline edit disabled |
| Message finishes | Chip unchanged | Inline edit enabled |
| User closes panel | Chip default | Closed, stays closed |
| Revision (newer version open) | Older chips superseded | Shows selected version |

**Explicitly not done:** including in-flight messages directly in `buildArtifactRegistry` (would blur finalized-history semantics). `resolveArtifactToolMode` / revise detection still uses finalized registry only. Visible loading/pending indicators on chip or panel for provisional state.

## No early panel preview: chip in chat, panel only after finalize

**Decision (superseded — see provisional overlay section):** remove `pendingArtifact` entirely. The chip appears in the chat as soon as the tool call parses, but the side panel only opens once the message is finalized and the version is in the registry. Open on the chip is disabled until then.

**Why:** live testing with temporary instrumentation confirmed that `create_artifact` tool-call arguments arrive atomically (zero observed partial-JSON chunks), so a loading skeleton or incremental preview UI was dead code. The `pendingArtifact` approach that replaced it introduced worse problems:

- **Panel opened too early** — as soon as the tool call landed, before the assistant message finished, stealing focus from the chat and making the close button feel broken.
- **Close re-opened after generation** — the finish effect depended on `selectedId`; closing set `selectedId = null`, which re-triggered auto-open because the condition included `selectedId === null`.
- **Close fought during generation** — `setPendingArtifact` re-ran on every prose chunk, undoing a user dismiss mid-stream.
- **Text selection broken** — the panel re-rendered on every prose token while `pendingArtifact` was active, resetting selection and scroll.

The gap before the chip appears (while the model is still writing its intro / thinking) is covered by the normal message-level loading state (avatar/thinking skeleton). No separate artifact loading chip is needed.

**Mechanism:**

- **`completeArtifacts`** — parsed from `message.blocks` via `extractCompleteArtifactsFromBlocks` / `getCompleteArtifactBlocksKey` in `createArtifactTool.ts`. Parsing is keyed on a stable fingerprint of tool-call arguments (id + title + content length), not the full `blocks` array, so it does not re-run on every prose token.
- **`ArtifactChip`** — renders as soon as `completeArtifacts` has an entry. While the message is still generating (not yet in registry), shows a **`preparing`** visual state: pulsing dot + "Preparing • vN" subtitle, disabled outline button with spinner + "Preparing…". Transitions to the normal default/active states once the message finalizes and Open becomes enabled. Active/superseded states only apply once a version exists in the registry and the panel is open.
- **`ArtifactPanel`** — reads only from `selectedArtifact` (registry-backed). No pre-registry preview branch.
- **Auto-open on finish** — `AssistantMessage` opens the panel once on the `generating → finished` transition (`justFinished` ref), not whenever `selectedId` changes. Only fires if:
    - this is the last message,
    - the artifact has a registry version index,
    - the user has not explicitly closed the panel (`panelUserClosed`),
    - nothing unrelated is already open (`selectedId === null || selectedId === artifact.id`).
- **User dismiss respected** — `closePanel()` sets `panelUserClosed = true`. `openArtifact()` clears it. `panelUserClosed` resets only when a **new** generation starts (`isGenerating` false → true on the last message), not on every prose chunk during an in-flight message.
- **Dead code removed** — `ArtifactChipLoading`, `streamingArtifact`, `parsePartialArtifactToolCall`, and all `pendingArtifact` context fields.

**UX summary:**

| Phase | Chat | Panel |
| --- | --- | --- |
| Message generating, no tool call yet | Avatar/thinking (message loading) | Closed |
| Tool call lands (message still generating) | Chip visible, **Preparing…** state | Closed |
| Message finishes | Chip visible, Open enabled | Auto-opens once (unless user closed) |
| User closes panel | Chip shows default state | Closed, stays closed |
| Revision (newer version open) | Older chips show "View vN" (superseded) | Shows selected version |

## Versioning stays entirely client-side — the LLM should not own it

**Decision:** artifact version/id tracking across a conversation (`buildArtifactRegistry`) stays a pure client-side derivation from the message chain. We explicitly rejected having the model self-report version numbers or otherwise own this bookkeeping.

**Why:**

- We already observed the model call the same id multiple times in one turn (see the duplicate-call finding above) — it can't be trusted to count its own calls reliably within a single turn, let alone across a whole conversation.
- Context compaction (`llm/compaction`) can summarize/drop older messages from what the model sees; a client-derived registry rebuilt from the full stored message chain can't drift this way, because it's a deterministic function of data that's never lost.
- Versioning/multi-artifact switching is a UI concern about presenting history the client already has — not something content generation needs to know about to do its job.

The registry isn't extra/duplicated mutable state in the problematic sense — it's a pure projection over the message chain (the single source of truth), recomputed fresh each time, the same pattern as a memoized selector. The in-flight-message gap (chip visible but not yet in registry) is handled at the UI layer by disabling Open until finalize — not by opening a pre-registry panel preview.

## Selection UI differs by artifact type (code vs document vs webpage)

**Decision:** when the user selects text in the artifact panel, the inline UI is type-specific:

- **Code** — one-click **Explain** or **Improve** buttons (no freeform input). Explain asks for a chat explanation; Improve asks the model to revise the selected snippet in the artifact.
- **Document** — freeform inline input ("Describe what you would like to update…") + send, same as a Canvas-style targeted edit.
- **Webpage** — no selection-based inline edit at all. Content renders inside a sandboxed, cross-origin `srcDoc` iframe (see next section); the panel has no way to read a text selection out of it the way it can for DOM-rendered code/document content. Follow-up changes go through the normal composer message flow instead.

**Why:** code and prose have different interaction patterns. Code benefits from quick, well-scoped actions; documents need open-ended edit instructions ("make it shorter", "change the tone"). A single doc-style textarea for both (introduced with the first inline editor) exposed the wrong affordance on code and regressed an intended Explain/Improve flow that never landed in git but was the product target. Webpage inherited neither pattern since the rendering surface itself doesn't support selection.

**Mechanism:** `ArtifactInlineEdit` branches on `inlineEditMode` (`'selection' | 'freeform' | 'none'`), looked up per-type from `artifactTypeConfig.ts` rather than switching on `artifactType` directly at each call site (see "Per-type config registry" below). Prompt wording lives in `artifactActionPrompts.ts`.

## Per-type config registry, not scattered ternaries

**Decision:** a single lookup, `ARTIFACT_TYPE_CONFIG` in `artifactTypeConfig.ts`, holds each type's icon, badge label, download extension, inline-edit mode, and renderer component. Call sites (`ArtifactPanel`, `ArtifactChip`, `ArtifactActionUserMessage`, `ArtifactInlineEdit`) look up `ARTIFACT_TYPE_CONFIG[type]` instead of branching on the type string directly.

**Why:** before this, every one of those call sites independently wrote `type === 'code' ? A : B` — icon/label badge logic alone was duplicated in three separate files. A 2-way ternary doesn't extend to a third value without touching every site by hand, which is exactly the failure mode that surfaced when the `webpage` type was added. Consolidating first made adding the third type a one-entry addition to the config instead of a 9-file sweep.

**Mechanism:** `ArtifactType` (`'code' | 'document' | 'webpage'`) and `isArtifactType` live in `parseArtifacts.ts` alongside `ParsedArtifact`; `artifactTypeConfig.ts` re-exports them so most consumers only need one import. `CodeRenderer`/`DocumentRenderer` were extracted out of `ArtifactPanel.tsx` into `artifactRenderers.tsx` specifically so the config object could reference them without a circular import back into `ArtifactPanel.tsx`.

## Webpage artifacts: sandboxed rendering with network egress blocked

**Decision:** the `webpage` type renders a complete, self-contained HTML document live inside a sandboxed `<iframe sandbox="allow-scripts" srcDoc={...}>` (no `allow-same-origin`, `allow-forms`, `allow-popups`, or `allow-top-navigation`) — the same "Gemini Canvas"-style live preview as code/document artifacts get static rendering. Network egress from the rendered page is blocked entirely via a `Content-Security-Policy` `<meta>` tag injected into the `srcDoc`'s `<head>` (`default-src 'none'`, `connect-src 'none'`, `frame-src 'none'`, `form-action 'none'`, with `script-src`/`style-src 'unsafe-inline'` and `img-src`/`font-src`/`media-src` limited to `data:`/`blob:`).

**Why:** `sandbox="allow-scripts"` alone blocks DOM/storage access to the parent page but does **not** restrict outbound network requests — LLM-authored script could otherwise `fetch`/beacon arbitrary data to an external origin, a real risk if the model is ever prompt-injected via untrusted content elsewhere in the conversation (a web-search result, a pasted document). A page-level CSP doesn't apply to an opaque-origin `srcDoc` iframe, so the restriction has to be injected into the document itself. Blocking network entirely (rather than allowlisting specific origins) closes the exfiltration path completely while still covering the target use cases (interactive demos, small games, visualizations, styled pages) — nothing in that use-case list needs to phone home.

**Mechanism:** `WebpageRenderer.tsx`. A `postMessage`-based resize bridge (parent → iframe, "recalculate on container resize") is validated via `event.source === iframeRef.current?.contentWindow` rather than any `event.origin` string check — the sandboxed `srcDoc` gives an opaque origin, so `event.origin` is the unhelpful literal `"null"` and isn't meaningfully comparable; tying trust to the specific window reference instead means no other script on the page can forge a message into this bridge.

**Type resolution:** unlike `code`/`document` (inferred from whether `language` is present when the model omits `type`), `webpage` is never inferred — it's the highest-blast-radius render path, so it's only ever reached when the model sends `type: "webpage"` explicitly (`resolveType` in `createArtifactTool.ts`). The tool description explicitly disambiguates `type: "code"` + `language: "html"` (HTML meant to be read as source) from `type: "webpage"` (HTML meant to be rendered live), since a model could otherwise reasonably reach for either on an "HTML" request.

**Download:** the downloaded `.html` file contains the raw model-generated content only — not the injected CSP meta tag or resize/error bridge script, since those are internal rendering-sandbox plumbing, not part of the artifact's actual content.

**Superseded scaffolding:** an earlier, disconnected attempt at HTML preview (`components/HtmlPreview/HtmlPreviewPanel.tsx` + `HtmlPreviewContext`) rendered arbitrary HTML the same sandboxed way but was never wired into any render tree (no CSP, and its `postMessage` listener never validated the sender — any source could forge a fabricated "runtime error" back into the conversation via its retry flow). Deleted in favor of `WebpageRenderer`, which fixes both gaps and integrates with the existing registry/versioning/chip system instead of being a separate panel.

## CSP injection parses real HTML instead of regex-matching raw text

**Decision:** the CSP `<meta>` and bridge `<script>` described above are injected by parsing `content` into a real `Document` via `DOMParser` and inserting actual DOM nodes, not by regex-matching the raw HTML string.

**Why:** the original implementation located `<head>` with plain, non-global regexes (`/<\/head>/i`, `/<head[^>]*>/i`) run against the unparsed string. Regexes have no notion of HTML structure — a decoy substring that merely _looks_ like `<head>` (inside an HTML comment such as `<!-- <head> -->`, or inside a `<script>`/`<style>` block's raw text) can sit earlier in the string than the real `<head>` element. Since `String.replace` without `/g` rewrites only the first (leftmost) match, the CSP could land in that inert comment/script text instead of the real, parsed `<head>` — shipping the document with **no CSP enforced at all** and silently defeating the one control blocking network egress from the sandboxed iframe. `content` is LLM-generated and reaches this function completely unsanitized (`createArtifactTool.ts` passes it straight through), so this was reachable via prompt injection from untrusted content elsewhere in the conversation — exactly the threat model the CSP exists to defend against.

**Mechanism:** `buildSandboxedDoc` in `WebpageRenderer.tsx` calls `new DOMParser().parseFromString(html, 'text/html')`, which always yields a real `head`/`body` per the HTML5 parsing algorithm — even for malformed or headless input — so there's no "head not found" fallback branch to get wrong. The CSP `<meta>` is created as an element and inserted as `doc.head`'s first child (a CSP meta tag only governs resources declared after it, so it must precede anything the artifact's own `<head>` puts there); the bridge `<script>` is appended to `doc.head` so it still runs before any body script. The result is serialized back via `doc.documentElement.outerHTML`, with the original doctype preserved. `DOMParser` never executes `<script>` elements during parsing, so running it on untrusted content is safe.

## User messages from selection actions: separate LLM payload from chat display

**Finding:** the first inline-editor implementation stored the full structured LLM prompt (artifact id, title, quoted selection, instruction) in `message.content` and rendered it verbatim in the user bubble — readable as a debug template, not as user intent.

**Decision:** artifact selection actions store **two** things on the user message:

- `content` / `blocks[0].content` — the structured LLM prompt (what the model and compaction/token logic see). Built by `buildArtifactActionLlmPrompt()` in `artifactActionPrompts.ts`.
- `artifactAction` (`ArtifactActionMeta` on `MessagePriv`) — UI metadata: `{ kind, artifactId, artifactTitle, artifactType, selection, userInstruction? }`. Rendered by `ArtifactActionUserMessage` in the chat bubble (action label + type badge + title + monospace snippet; `userInstruction` shown for document edits).

**Why:** `message.content` already serves as the LLM-facing string everywhere (API, regenerate, retry, token estimates). Reusing it for display forced a false choice. A separate metadata field mirrors the existing pattern for UI-specific message shapes (e.g. `compaction` on `MessagePriv`) without inventing a new block type for user messages.

**Mechanism:**

- `handleSendArtifactAction(meta)` in `useLumoActions` — thin wrapper used only from `ArtifactInlineEdit`; builds the LLM prompt and threads `artifactAction` through `ActionParams` → `NewMessageData` → `createMessagePair`. The composer's `handleSendMessage` signature is unchanged.
- `getMessageDisplayContent()` for human-facing previews (e.g. all-chats list); `getMessageContent()` unchanged for model/context use.
- Edit on user messages is **disabled** when `artifactAction` is set — editing the raw LLM template would be confusing and is not supported in v1.

**Explicitly out of scope:** retroactive prettification of older user messages that predate `artifactAction` (they still show the raw prompt string). No prompt-string parsing fallback — metadata is set at send time only.

## Webpage artifact CSP: srcDoc/blob rewrite explored and rejected — real cross-origin response is the only viable fix

**Finding:** the `srcDoc`-based CSP approach described above (`## Webpage artifacts: sandboxed rendering with network egress blocked`) works with no page-level CSP present (local dev sends none), but breaks in any environment with a real page-level CSP (confirmed in QA, later also reproduced against dev with a QA-equivalent header). Root cause: a `srcDoc` document is a "local-scheme" document and unconditionally **inherits** the CSP of the document that created it, per spec — regardless of the iframe's `sandbox` attributes. The CSP `<meta>` tag injected into the `srcDoc` (`buildSandboxedDoc`) can only _restrict_ that inherited policy further, never loosen it. Real environments serve `script-src` with no `'unsafe-inline'`, so every inline `<script>` and `on*="..."` handler in the artifact is blocked outright, while the artifact's own meta tag claiming `script-src 'unsafe-inline'` is simply ignored for anything the inherited policy already disallows.

**Rejected: loosen Lumo's own `script-src` to include `'unsafe-inline'`.** Two independent reasons:

- QA's `script-src` already includes a hash-source (`'sha256-...'`). Per the CSP3 spec, when a `script-src` directive contains a nonce-source or hash-source, any `'unsafe-inline'` token in that same directive is ignored by every browser that understands hash/nonce sources (i.e. everything currently supported) — it exists purely as a CSP1-only legacy fallback. Adding `'unsafe-inline'` next to an existing hash-source would very likely be a no-op in practice.
- Even setting that aside, `srcDoc` inheritance means there is no directive that scopes a looser policy to just the artifact iframe — loosening `script-src` app-wide to unblock one sandboxed, deliberately-untrusted-content feature would weaken XSS protection for the entire Lumo document, not just the iframe.

**Rejected: rewrite inline scripts/handlers into `<script src="blob:...">`, since `blob:` is already an allowed `script-src` source in real environments.** Prototyped in `WebpageRenderer.tsx` (`buildSandboxedDoc` extracting inline `<script>` bodies and `on*` attributes into `Blob`-backed object URLs, in place, preserving document order) and unit-tested, but broken when exercised live in a browser: the sandboxed iframe failed every blob load with "Not allowed to load local resource." Root cause: `blob:` URL dereferencing requires the fetching context's origin to match the creating context's origin (per the URL/Fetch spec's Blob URL Store lookup). `sandbox="allow-scripts"` with no `allow-same-origin` gives the iframe an **opaque origin** by definition — one that never equals any other origin, including the parent's — so a blob created in the parent page can never be loaded by this iframe regardless of CSP. Adding `allow-same-origin` to fix the blob load was also rejected: for a `srcDoc` iframe, `allow-same-origin` grants the _parent's real origin_, which would give attacker-influenceable, LLM-generated script access to Lumo's own cookies, localStorage, and IndexedDB (encrypted conversation data) — exactly the access the opaque-origin sandbox exists to deny. This POC was reverted (not merged).

**Decision going forward:** the only mechanism compatible with both requirements at once (independent CSP for the artifact + no origin access to Lumo's own session data) is serving the artifact document via a genuine HTTP response from a real, different origin — loaded via `iframe.src`, not `srcDoc`/`blob:`. A document fetched this way is not a local-scheme document, so CSP inheritance doesn't apply at all: it gets whatever CSP header that specific response sets, independently. It's also not opaque-origin-by-construction — ordinary cross-origin isolation already keeps it away from Lumo's cookies/storage, with `sandbox="allow-scripts"` still layered on top for defense-in-depth (blocking popups/forms/etc.), and no `blob:` URLs are needed anywhere in this design since the served document can allow its own inline scripts directly via its own CSP (nonce- or nature-of-origin-scoped, since real per-load header generation is possible for a real HTTP response in a way it isn't for a `srcDoc` string baked into the SPA at initial page load).

Two candidate shapes for "a real, different origin," not yet chosen between:

- A dedicated new subdomain (e.g. `lumo-artifact.proton.me`) with its own static "sandbox shell," DNS/ingress, and K8s deploy config — heavier, requires the infra/K8s-values team (not implementable from this repo alone), but fully isolated from any existing Lumo infrastructure.
- A route under the existing `lumo-api.proton.me` origin (already in Lumo's `frame-src` allowlist) that accepts the generated document and serves it back with its own per-route CSP header — lighter on infra (no new subdomain/DNS/K8s service), contingent on confirming the backend can set a per-route CSP distinct from whatever a fronting proxy/CDN applies domain-wide, and on resolving whether sending artifact content (LLM-generated, not user-authored, but still content that currently never leaves the client in plaintext) to a backend for storage-and-reserve fits Lumo's client-side encryption model — flagged, not resolved, pending input from whoever owns that guarantee.

Client-side protocol change either way: `WebpageRenderer.tsx` would `postMessage` the generated document to a loaded shell page instead of setting `srcDoc` directly, with a small bootstrap script on the shell page to receive and render it. Not yet implemented — this section records the decision to abandon `srcDoc`/`blob:` entirely, not a chosen final mechanism.
