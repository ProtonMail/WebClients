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

**Why:** the artifact panel's selection-based inline-edit flow (`ArtifactInlineEdit.tsx`) sends a plain follow-up message via the normal `handleSendMessage` path, with no mode re-entry — it depends on the tool still being reachable. Requiring re-entry for every revision would break that flow and create needless friction for "make it shorter"-style follow-ups. Simultaneously, allowing the model to create unrelated new artifacts outside the mode would reintroduce the same automatic-detection guessing problem we just removed, just narrower in scope.

**Mechanism:** `resolveArtifactToolMode` derives `'revise'` purely from conversation state (`buildArtifactRegistry(messageChain)` non-empty) — no UI state threading needed, and it automatically covers the inline-edit flow for free.

## Create Artifact mode is mutually exclusive with Create Image mode

**Decision:** entering one composer mode exits the other, matching the existing Create Image UX pattern exactly (click to enter, exit chip with an X to leave).

**Why:** no clear product case for having both active at once; avoids ambiguous composer state.

## React key / duplicate-version bug: the model can call the tool more than once per turn

**Finding:** a single assistant message can contain more than one `create_artifact` tool_call block for the _same_ id — observed live when a model tried to satisfy a title-length schema constraint (2-5 words) against a much longer user-requested title, and retried within one reply. This caused a React duplicate-key warning (two `ArtifactChip`s keyed by the same `${id}-${messageId}`) and would have inflated the version-history nav with phantom intermediate attempts.

**Decision:** collapse multiple tool calls for the same id within one message into a single logical result, keeping the _last_ call's content — both in the chip renderer (`AssistantMessage.tsx`) and in the registry builder (`getToolCallArtifacts` in `artifactRegistry.ts`). This is a rendering/data-normalization fix, not a prompt fix — the underlying prompt-wording tension (long requested title vs. short schema field) is a separate, unresolved issue.

## Streaming/"loading" state: what actually drives it, and what doesn't

**Finding:** the loading chip (`ArtifactChipLoading`) is gated on the tool call's `arguments` field still being a raw, not-yet-fully-parsed JSON string. Verified live with temporary instrumentation (logging chunk count/timing per call) across multiple real calls, including ones with a few thousand characters of content, not just trivial edits: every one arrived with **zero** observed streaming chunks — the block was already fully parsed the first time the frontend ever saw it. No client-side throttling/batching suppresses this (a smoothing/pacing transform exists for plain text tokens but explicitly passes `tool_call` messages through unaffected) — this is delivery granularity from the backend/model, and for `create_artifact` specifically it appears to be atomic rather than token-streamed, at least across everything tested so far (not proven for arbitrarily large content).

**Implication:** a UI built around watching JSON parse incrementally is watching a signal that essentially doesn't occur in practice for this tool. It should not be the basis for "is this artifact ready to interact with," and the old red-bordered `ArtifactChipLoading` skeleton is effectively dead code under normal usage.

**Decision (implemented):** redefine "loading"/"pending" around message-completion state instead of JSON-parse-completeness:

- The artifact's _content_ is available almost immediately once its tool_call block parses (via `completeArtifacts`, derived straight from `message.blocks` — same timing/pattern as how `extractSearchResults` surfaces web-search results mid-generation, with no gate on message status).
- What's actually still pending until the message finishes (`message.status` gets set) is only the **registry** entry — `buildArtifactRegistry` deliberately excludes any message with `status === undefined`, i.e. the in-flight message, because the registry needs to track ordered versions/ids across the whole conversation and shouldn't bake in a version from a message that could still change.
- This was also the root cause of a distinct bug: the chip could look fully "done" and clickable as soon as its JSON parsed, before the registry caught up — clicking it opened whatever the registry fell back to (the previous version), not the new content already sitting in `completeArtifacts`.

**Shipped (correctness only — no visual "finalizing" indicator yet):**

- `ArtifactContext` gained `pendingArtifact`/`setPendingArtifact`/`openPendingArtifact` — a fully-parsed artifact whose message hasn't finished (so it isn't in `registry` yet). `AssistantMessage.tsx` pushes it alongside the existing `streamingArtifact` handling.
- `ArtifactPanel` renders `pendingArtifact` through the real `ArtifactContent` renderer (proper markdown/code highlighting, since the content is already valid) instead of an empty skeleton or a stale frozen view, for both fresh creation and revision of something already open.
- `ArtifactChip`'s click handler opens from `pendingArtifact` via `openPendingArtifact()` when the registry doesn't have a version index yet, instead of the old stale-fallback `openArtifact(id)`.

**Explicitly reverted:** a first attempt also added a visible "Finalizing…" + `CircleLoader` treatment on both the chip and panel header for this pending state. Removed after a follow-up conversation revealed it was solving a different problem than the one being asked about (a per-message "this call revised vs. created the artifact" indicator, not a generation-in-progress indicator) — see next entry once that's resolved. The underlying `pendingArtifact` correctness fix above stays; only the visual treatment was pulled.

## Versioning stays entirely client-side — the LLM should not own it

**Decision:** artifact version/id tracking across a conversation (`buildArtifactRegistry`) stays a pure client-side derivation from the message chain. We explicitly rejected having the model self-report version numbers or otherwise own this bookkeeping.

**Why:**

- We already observed the model call the same id multiple times in one turn (see the duplicate-call finding above) — it can't be trusted to count its own calls reliably within a single turn, let alone across a whole conversation.
- Context compaction (`llm/compaction`) can summarize/drop older messages from what the model sees; a client-derived registry rebuilt from the full stored message chain can't drift this way, because it's a deterministic function of data that's never lost.
- Versioning/multi-artifact switching is a UI concern about presenting history the client already has — not something content generation needs to know about to do its job.

The registry isn't extra/duplicated mutable state in the problematic sense — it's a pure projection over the message chain (the single source of truth), recomputed fresh each time, the same pattern as a memoized selector. The in-flight-message gap described above is a narrow bug in that derivation, not a reason to reconsider the architecture.
