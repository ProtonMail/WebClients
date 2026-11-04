# Android/iOS Skills composer contract (version 1)

Web implementation: additive Skills catalog and invocation support. Native picker adoption is delivered separately; this document specifies the web contract. No native skill creation, editing, or deletion is included. Legacy `customLumos`, `selectedCustomLumo`, `selectCustomLumo(callId, id)`, and `clearCustomLumo(callId)` retain their meaning and behavior for older mobile versions.

## Version routing

The shared gate is `canUseNativeSkills()` in `src/app/util/userAgent.ts`, using the existing native platform parser and version comparator.

| Native client              | Available picker  |
| -------------------------- | ----------------- |
| Android below 2.2.0        | Custom Lumos only |
| Android 2.2.0 and later    | Skills only       |
| iOS/iPadOS below 2.2.0     | Custom Lumos only |
| iOS/iPadOS 2.2.0 and later | Skills only       |

Older clients receive `skills.status: "unavailable"` and no Skills commands; `invokeSkill` rejects with `skills_unavailable`. Newer clients receive `customLumos: []` and `selectedCustomLumo: null`, and legacy select/clear calls reject with `custom_lumos_unavailable`. Newer clients never fall back to Custom Lumos when Skills is disabled, loading, empty, or failed. Existing feature/context gates still apply. Unknown/malformed user agents cannot enable Skills. Android distribution suffixes use the existing version-comparison behavior.

Both bridge implementations remain in web until the last supported user has upgraded past the thresholds. Removing the legacy bridge requires a separate migration decision; this change does not delete it. Browser web pickers are unchanged.

## State JSON

The existing `getState(callId)` result and state notifications gain `skills`:

```json
{
    "skills": {
        "version": 1,
        "status": "ready",
        "revision": "opaque-token",
        "commands": [
            {
                "id": "bundle-id/skills/chart",
                "handle": "chart",
                "name": "Chart",
                "description": "Create a chart",
                "group": "Analysis"
            }
        ]
    }
}
```

All fields shown are required except `group`, omitted for standalone skills. `version` is the number 1. `status` is `unavailable | loading | ready | error`. `revision` is a string, initially empty while unavailable. Treat it as opaque, transient, and specific to the account/composer and catalog. Do not persist it. `commands` is an ordered array. A standalone command's `id` is its skill ID; a plugin sub-skill uses the existing selection ID (bundle ID + `/` + folder path). Pass IDs back verbatim. Render `/${handle}`; use `name`, `description`, and optional `group` for display. Never derive handles or resolve collisions on mobile.

Web applies `groupSkillCommands(getSkillCommands(skills))`, exactly as the web tools picker does. Only enabled commands appear; roots win collisions before plugin sub-skills, following existing helper ordering. The entire invocable catalog is included; the slash-autocomplete search limit is not applied. Instructions and files are not sent to native.

State transport remains Android `Android.onStateChange(JSON.stringify(state))` and iOS `webkit.messageHandlers.nativeComposerStateHandler.postMessage(state)`.

## Invocation and response

```js
window.nativeComposerApi.invokeSkill(callId, {
    revision: skills.revision,
    id: selectedCommand.id,
    text: currentNativeDraft,
});
```

`callId`, `revision`, `id`, and `text` are strings. Empty draft text is valid. The method uses the existing callback transport: Android `Android.postMessage(JSON.stringify(response))` or iOS `webkit.messageHandlers.nativeComposerHandler.postMessage(response)`.

Success:

```json
{ "callId": "request-1", "status": "success", "data": { "text": "/chart Existing draft" } }
```

Failure:

```json
{ "callId": "request-1", "status": "error", "error": "skills_stale" }
```

Errors: `skills_invalid_request` for missing/invalid request fields; `skills_unavailable` for no active handler, editing a previous message, unavailable account/context, loading, or load error; `skills_stale` for a mismatched revision or missing command. Unavailability takes precedence over request validation when there is no active handler or native edit mode is active. Failures do not modify the draft. On stale selection, use the latest catalog and require a new user selection; do not replay against a new command with the same handle.

Web uses `prependSkillHandle`: prepend `/${handle} `, trim existing leading whitespace, preserve the remaining text, and do nothing when that handle is already invoked. The mounted composer owns the handler and its React draft setter; insertion works even when the editor DOM is hidden or absent. With no mounted composer, invocation fails. The Redux `insertSkillCommand` action alone is insufficient: only the web editor consumes its pending handle, and it does not own native-only text.

## Required native draft sequencing

1. On selection, capture the current editor text and active account/composer identity. Allow only one invocation in flight.
2. Serialize invocation with editing and send. Briefly queue text mutations and send until the callback has been handled; never replace a newer independently edited draft with an old response. Native may instead temporarily disable editing for this round trip.
3. On success, replace the actual native draft with `data.text`, then resume/replay queued operations against that value. Web has already mirrored the same value into its composer state. Do not call `selectCustomLumo` or dispatch another insertion.
4. On error, retain the original draft, release queued operations, and update the picker from the latest state. On transport timeout, retain text, release editing, report failure, and do not silently retry. A later invocation carries the current native text and reestablishes the mirror.
5. Discard callbacks and clear queued operations/selections when the account/composer changes. Do not restore a previous account's draft. A WebView reload creates a new bridge session; never reuse a revision across reloads.
6. Send the resulting native text using existing `sendPrompt(callId, text)`. The normal web send pipeline resolves slash commands against the current catalog, loads/decrypts plugin SKILL.md and referenced files, and builds the model context. A skill disabled/deleted after insertion no longer resolves. A handle reassigned after insertion follows existing web send-time handle semantics; revision protection covers insertion only.

This is an invocation-time mirror, not continuous two-way draft synchronization. Native remains authoritative between invocations, including timeout recovery. Platform callback delivery and local edit queue behavior require Android/iOS runtime tests.

## State transitions and lifecycle

| Condition | status | commands / behavior |
| --- | --- | --- |
| Bridge initialized; no composer | unavailable | Empty; reject invocation |
| Guest, no account identity, flags disabled, project/schedule, closed conversation | unavailable | Empty; reject invocation |
| Native edit-message mode | unavailable | Empty; reject invocation; legacy edit behavior unchanged |
| Skills idle/loading | loading | Empty; reject invocation |
| Skills load fails | error | Empty; reject invocation; no automatic retry loop |
| Loaded with no enabled commands | ready | Empty; display empty state |
| Loaded with commands | ready | Ordered catalog; invocation enabled |
| Local save/toggle/delete or successful remote refresh | derived from current state | Publish changed catalog/revision |
| Account/context replacement or teardown | unavailable, then new context state | Old handler/revision invalidated |

Availability requires the version gate above plus existing `LumoCustomAgents` and `LumoTooling` flags, authentication, and the existing `canUseAgents` context guard. Account identity is checked against the current Redux user on every invocation. Native account switching currently reloads through bootstrap's `consumeNativeSwitchLocalID`; Skills are not included in the persisted Redux snapshot. Context changes include composer mode, conversation ID, and space ID. Edit-message mode is deliberately unavailable in version 1 because its draft belongs to the pending edit flow, not the main composer.

`useSkills` retains ownership of loading after master-key readiness and legacy migration. The existing sync listener sends local changes; the event loop syncs remote changes and refreshes Redux. The bridge subscribes to Redux and also reads it synchronously during invocation, so disable/delete is checked even before React effects publish. Error recovery follows the existing Skills loading flow (including a later successful reload); this contract adds no retry command or storage.

## Rollout and rollback

1. Deploy web support first. Android and iOS versions below 2.2.0 continue using legacy fields. Verify their JSON decoders ignore the additional field before rollout; simulated bridge tests cannot prove real decoder behavior.
2. Ship Skills adoption in Android 2.2.0 and iOS 2.2.0. These versions use `skills.version === 1` and `invokeSkill`; older versions continue using their legacy picker. Do not fall back to legacy data merely because a supported Skills catalog is loading, failed, or empty.
3. Implement state UI and invocation sequencing above, including account/context callback invalidation. No Skills business logic belongs in native.
4. Test each platform with newly added root/plugin skills, duplicate handles, disabling/deleting while a picker is open, empty/error/loading states, typing around an invocation, timeout, navigation/account switching, and send-time resolution.
5. Release native adoption. A rollback to Custom Lumos on newer versions requires a coordinated change to the web version gate; native alone cannot switch back. Keep the legacy bridge until no supported user remains below the thresholds, then remove it in a separate change.

## Validation limits

Web tests cover controller behavior, real composer draft state without an editor DOM, Android/iOS transport envelopes, native send routing, and encrypted plugin file resolution in the existing resolver. They do not execute Swift/Kotlin or a live signed-in account. Native implementation status, device testing, and deployment are outside this web-only validation.
