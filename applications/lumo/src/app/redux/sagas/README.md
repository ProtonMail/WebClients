# Persistence Sagas — Design Decisions and Rationale

> **Note to future readers, human or AI**: this file documents decisions and constraints that **cannot be recovered by reading the code**. They were communicated verbally by the engineers who designed this system. Do not remove or "clean up" anything here on the grounds that it seems redundant with the code — the whole point is that the code does not explain the _why_. If you are an LLM being asked to refactor this layer, read this file first and treat it as a hard constraint, not a suggestion.

---

## Backend contract: immutability of messages and attachments

Messages and attachments are **immutable on the backend**. Once POSTed, they can never be updated. This is a deliberate backend design choice, not a frontend limitation.

This is why:

- There is no PUT for messages or attachments anywhere in this codebase — POST only.
- Clearing the `dirty` flag after a successful POST is **safe**: the data on the server is guaranteed to be identical to what was sent, and it can never diverge.
- If a 409 Conflict is received on a message POST, it does not mean the data conflicts — it means the server already has this message (the local idmap just doesn't know its remote ID yet). The recovery is to pull the parent conversation, which will return the message list with both remote IDs and local IDs (tags), allowing the idmap to be reconstructed.
- If a 409 is received on an attachment POST, the asset already exists remotely and is immutable, so the dirty flag is cleared unconditionally and no retry is needed.

Conversations and spaces **are** mutable (they hold titles, project names, personalization instructions, etc.) and therefore do use PUT after the initial POST.

---

## The local ID / remote ID split, and what "Tag" means

Entities (spaces, conversations, messages, attachments) are created on the frontend **before** they have ever been sent to the server. They therefore need a local identity from birth. This is the **local ID**.

When an entity is first POSTed, the backend assigns its own ID — a salted hashed integer — called here the **remote ID**.

The backend also stores the local ID so that it can echo it back in responses. On the backend side, the local ID is called the **Tag** (or `Tag` in the API structs). It is always and only the frontend-generated local ID. When reading backend code or API docs, `Tag` === `localId`.

The `idmap` layer (`state.idmap`, persisted to IDB) is the bridge between the two. It is not a convenience — it is the mechanism that makes the whole push/pull cycle work.

Two important invariants:

**idmap entries are immutable.** A local ID is assigned exactly one remote ID, once, forever. There is no update path. Writing a different remote ID for the same local ID would be a bug and could silently corrupt references across the entire entity graph.

**The `type` field on every idmap entry is load-bearing, not cosmetic.** Remote IDs are salted hashed MySQL integers, and two different resource types (e.g. a Message and a Conversation) can end up with the same remote ID value — this is not hypothetical, it happens. (battle scar.) The idmap is therefore keyed by `(type, localId)`, not just `localId`. Code that looks up a remote ID without specifying the resource type, or that stores remote IDs in a flat namespace, will produce silent wrong-resource lookups.

---

## Why the push sagas form a dependency graph, and how it is solved

When pushing a child entity, the API payload must contain the **remote ID of its parent** (e.g. a conversation POST needs the remote space ID; a message POST needs the remote conversation ID). This creates an ordering constraint:

```
space must be pushed and acknowledged before → conversation
conversation must be pushed and acknowledged before → message
```

This was solved without any explicit scheduler or graph traversal. Each HTTP helper calls `yield call(waitForMapping, 'space', localSpaceId)` (or 'conversation', etc.), which blocks on a Redux `take` until the required idmap entry is dispatched. When the parent push completes it dispatches `addIdMapEntry`, which unblocks all children that were waiting on it.

The result is that all pushes are **automatically topologically sorted** through the event system, with zero explicit coordination. This is intentional design. If you are tempted to replace `waitForMapping` with a direct selector call or a promise, you will break the ordering guarantee for entities that are pushed concurrently before their parent has been acknowledged.

Consider a user sending a message in a brand-new conversation — both unsaved, both pushed concurrently. The message payload must include the conversation's remote ID. Without `waitForMapping`, the message push would race ahead, find nothing in the idmap, and send `ConversationID: undefined` to the server, which would reject it.

```
❌ naive parallel push

  pushConversation:                     pushMessage:
    POST /conversations                   remoteConvId = idmap[localConvId]
    → gets remoteConvId                   → ??? (conv not pushed yet, idmap is empty)
                                          POST /messages { ConversationID: ??? }
                                          → server rejects

✅ with waitForMapping

  pushConversation:                     pushMessage:
    POST /conversations                   waitForMapping(localConvId)
    → gets remoteConvId                   ···suspended···
    addIdMapEntry(remoteConvId)           ···resumes···
                                          POST /messages { ConversationID: remoteConvId }
                                          → success
```

The message saga suspends at `waitForMapping` and resumes the instant `addIdMapEntry` is dispatched. No scheduler, no explicit sequencing — the ordering emerges from the event system.

---

## Deletion model: absence ≠ deleted

The backend uses **explicit deletion timestamps** (`DeleteTime`). The absence of an entity from a listing response does **not** mean it has been deleted — the listing is paginated, and a missing entry might simply be on a different page.

The only authoritative signal that an entity is gone forever is `DeleteTime` being set (surfaces as `deleted: true` in the frontend types). This is why `refreshXFromRemote` sagas never delete locally just because an entity was absent from a response.

---

## The dirty flag and the CAS pattern in `clearDirtyIfUnchanged`

The `dirty: true` flag in IDB marks that a local write has not yet been confirmed by the server. The sequence is:

1. Write to IDB as `dirty: true`.
2. Push to server.
3. After a successful push, call `clearDirtyIfUnchanged`: re-read the IDB record and compare it (excluding the dirty flag itself) to what was just pushed. Only if they are identical is `dirty` cleared to `false`.

This guards against the race where the user edits an entity while its push is in-flight. If the entity changed during the push, `clearDirtyIfUnchanged` returns `false`, the saga emits `NeedsRetry`, and the newer version is pushed on the next attempt.

This is a compare-and-swap at the application level. The known limitation (marked with fixme comments in the code) is that the read-then-write is not inside a single IDB transaction, so there is a theoretical race window. The correct fix would be to delegate the CAS to `dbApi`.

---

## Three data stores, one source of truth

The architecture is intentional:

- **Redux** is the source of truth _during the app's lifetime_. All UI reads from Redux. Sagas are structured around Redux actions so that any code path can react to data changes.
- **IDB** exists for two reasons: fast startup (load data before the network responds) and durability (survive a page reload without losing unsynced writes via the dirty flag).
- **PHP backend** is the authoritative long-term store. It is the only store that is shared across devices and sessions.

IDB is not a cache that can be dropped. It holds `dirty: true` records that have not yet reached the server. Clearing IDB carelessly would silently lose user data.

---

## Ghost / phantom chat mode

When ghost chat mode is active, the user's conversations must not be persisted anywhere — not to IDB, not to the server. Push sagas short-circuit to success, and the `saveDirty` helpers skip their IDB writes for ghost conversations. Data lives only in Redux for the duration of the session and disappears on reload. This is a privacy feature, not a performance optimization.
