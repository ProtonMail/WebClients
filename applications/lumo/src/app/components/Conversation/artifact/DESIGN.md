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

## No early panel preview: chip in chat, panel only after finalize

**Decision:** remove `pendingArtifact` entirely. The chip appears in the chat as soon as the tool call parses, but the side panel only opens once the message is finalized and the version is in the registry. Open on the chip is disabled until then.

**Why:** live testing with temporary instrumentation confirmed that `create_artifact` tool-call arguments arrive atomically (zero observed partial-JSON chunks), so a loading skeleton or incremental preview UI was dead code. The `pendingArtifact` approach that replaced it introduced worse problems:

- **Panel opened too early** — as soon as the tool call landed, before the assistant message finished, stealing focus from the chat and making the close button feel broken.
- **Close re-opened after generation** — the finish effect depended on `selectedId`; closing set `selectedId = null`, which re-triggered auto-open because the condition included `selectedId === null`.
- **Close fought during generation** — `setPendingArtifact` re-ran on every prose chunk, undoing a user dismiss mid-stream.
- **Text selection broken** — the panel re-rendered on every prose token while `pendingArtifact` was active, resetting selection and scroll.

The gap before the chip appears (while the model is still writing its intro / thinking) is covered by the normal message-level loading state (avatar/thinking skeleton). No separate artifact loading chip is needed.

**Mechanism:**

- **`completeArtifacts`** — parsed from `message.blocks` via `extractCompleteArtifactsFromBlocks` / `getCompleteArtifactBlocksKey` in `createArtifactTool.ts`. Parsing is keyed on a stable fingerprint of tool-call arguments (id + title + content length), not the full `blocks` array, so it does not re-run on every prose token.
- **`ArtifactChip`** — renders as soon as `completeArtifacts` has an entry. Open is **disabled** while `getArtifactVersionIndexForMessage` returns `null` (message not finalized → not in registry). Active/superseded states only apply once a version exists in the registry and the panel is open.
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
| Tool call lands (message still generating) | Chip visible, Open disabled | Closed |
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

## Selection UI differs by artifact type (code vs document)

**Decision:** when the user selects text in the artifact panel, the inline UI is type-specific:

- **Code** — one-click **Explain** or **Improve** buttons (no freeform input). Explain asks for a chat explanation; Improve asks the model to revise the selected snippet in the artifact.
- **Document** — freeform inline input ("Describe what you would like to update…") + send, same as a Canvas-style targeted edit.

**Why:** code and prose have different interaction patterns. Code benefits from quick, well-scoped actions; documents need open-ended edit instructions ("make it shorter", "change the tone"). A single doc-style textarea for both (introduced with the first inline editor) exposed the wrong affordance on code and regressed an intended Explain/Improve flow that never landed in git but was the product target.

**Mechanism:** `ArtifactInlineEdit` branches on `artifactType`; prompt wording lives in `artifactActionPrompts.ts`.

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
