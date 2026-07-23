/**
 * The search engine drives blob storage by emitting events (Load / Save / Release / …)
 * that the `EncryptedBlobTransaction` handlers act on. Each event's kind is a runtime
 * value read via `kind()`, and it is NOT reflected in the event's type — every
 * `CleanupEvent`, `QueryEvent`, etc. looks identical to the compiler regardless of kind.
 *
 * That means nothing stops you from handing, say, a Save event to `handleLoadEvent`; the
 * mistake would only surface at runtime when the wrong `kind()`-specific method throws.
 *
 * These guards close that gap. Each narrows an event to a specific kind by refining its
 * `kind()` return type, so the handlers can require the right kind in their signatures and
 * passing the wrong one becomes a compile error. Callers narrow with a guard at the single
 * dispatch site (where the runtime `kind()` check already lives), so no extra runtime check
 * is introduced — the safety is purely at the type level.
 */
import type { CleanupEvent, ExportEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { CleanupEventKind, ExportEventKind, QueryEventKind, WriteEventKind } from '@proton/proton-foundation-search';

export type BlobEvent = CleanupEvent | QueryEvent | WriteEvent | ExportEvent;

/** The low discriminants shared by every *EventKind enum, named so they can be used
 *  in place of bare numbers in the event types and guards below. */
export const Kind = { Load: 0, Save: 1, Release: 2 } as const;

// The *EventKind enums intentionally share these discriminants, which is what lets a
// single `Kind` value stand in for a kind across every event type. These lines fail to
// compile if any enum ever drifts from the shared value.
CleanupEventKind.Load satisfies typeof Kind.Load;
QueryEventKind.Load satisfies typeof Kind.Load;
WriteEventKind.Load satisfies typeof Kind.Load;
ExportEventKind.Load satisfies typeof Kind.Load;
CleanupEventKind.Save satisfies typeof Kind.Save;
WriteEventKind.Save satisfies typeof Kind.Save;
CleanupEventKind.Release satisfies typeof Kind.Release;

/** A blob event narrowed to a specific `kind()`. The event classes don't encode their
 *  kind in the type, so we thread it through `kind()`'s return type: this lets the
 *  handlers require the right kind at compile time instead of re-checking at runtime.
 *  `K` is a `typeof Kind.*` value (e.g. `typeof Kind.Load`). */
export type OfKind<E extends BlobEvent, K extends number> = E & { kind(): K };

/** Type guards used at the dispatch sites to narrow an event to its kind, so the wrong
 *  kind can't reach a handler. The runtime check here replaces the caller's `kind()`
 *  dispatch — it isn't an extra check. */
export function isLoadEvent<E extends BlobEvent>(event: E): event is OfKind<E, typeof Kind.Load> {
    return event.kind() === Kind.Load;
}

export function isSaveEvent<E extends CleanupEvent | WriteEvent>(event: E): event is OfKind<E, typeof Kind.Save> {
    return event.kind() === Kind.Save;
}

export function isReleaseEvent(event: CleanupEvent): event is OfKind<CleanupEvent, typeof Kind.Release> {
    return event.kind() === Kind.Release;
}
