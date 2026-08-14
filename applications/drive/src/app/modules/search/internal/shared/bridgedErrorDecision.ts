import type { ErrorDecision } from './errors';

/**
 * Where an error's classification is recorded so it survives the worker boundary.
 *
 * The SDK runs on the main thread, the indexer runs in the SharedWorker, and the two talk over
 * Comlink. Comlink sends everything with postMessage, which cannot hand over an object by reference
 * because the two contexts share no memory. It copies instead, using the structured clone algorithm,
 * and that copy is lossy for errors in a way that matters here.
 *
 * A cloned error always comes out as a plain Error:
 *   - the prototype chain is not copied, so any subclass is gone
 *   - `name` is kept only when it is a built-in one (Error, TypeError, RangeError, ...). Anything
 *     else is replaced with 'Error'
 *   - own properties are not copied at all, whatever they are
 *   - only `message`, `stack` and `cause` come through
 *   - DOMException is the single exception: the spec clones it as its own type, so its `name` lives
 *
 * Concretely: an AbortError thrown by the SDK on the main thread is a subclass carrying
 * `name: 'AbortError'`. In the worker it arrives as a plain Error carrying `name: 'Error'`. Both
 * `instanceof AbortError` and `name === 'AbortError'` are now false, and nothing left on the object
 * says whether the operation was cancelled or genuinely failed. A 503 loses its `statusCode` the
 * same way, so it is indistinguishable from a broken file.
 *
 * The decision is therefore worked out while the error is still intact, and re-attached on arrival:
 *
 *   MAIN THREAD (SDK lives here)          │  SHARED WORKER (indexer lives here)
 *   ────────────────────────────          │  ──────────────────────────────────
 *   SDK throws ServerError                │
 *     instanceof ServerError  yes         │
 *     name        'ServerError'           │
 *     statusCode  503                     │
 *         │                               │
 *     serialize()                         │
 *       classifyError(e)                  │
 *         -> {transient, server}          │
 *         │                               │
 *         └── postMessage ────────────────┼──► deserialize()
 *             structuredClone drops:      │      setBridgedErrorDecision(e, decision)  <== SET
 *               instanceof  -> no         │          │
 *               name        -> 'Error'    │        throw e
 *               statusCode  -> gone       │          │
 *             (message and cause survive) │      caller catches, then asks:
 *                                         │        classifyError(e) / isAbortError(e)
 *                                         │          getBridgedErrorDecision(e)        <== GET
 *                                         │            -> {transient, server}
 *
 * Only the receiving side ever touches the map. Object references do not survive a clone, so
 * identity is not what travels: the decision crosses as a plain object (which clones faithfully) and
 * is keyed locally against the rebuilt error that `deserialize` is about to throw.
 *
 * One thing to watch: the association does NOT survive a SECOND clone, and errors here routinely
 * make a round trip. Reporting only works on the main thread, because `@proton/metrics` lacks the
 * auth headers it needs inside a worker and Sentry is never initialised there at all. So an error
 * that just arrived from the main thread has to travel back to it to be reported, either as an
 * argument on the bridge or over a BroadcastChannel. Neither is a thrown value, so neither passes
 * through the transfer handler that attaches the decision: both are plain clones, producing yet
 * another object with no entry here. Those callers pass the `ErrorDecision` alongside as an ordinary
 * argument instead (see `searchMetrics.markIndexerError`).
 *
 * A WeakMap rather than a property on the error, because the error is not ours to mutate, a property
 * would surface in anything that logs or serialises it, and it would buy nothing anyway: own
 * properties are dropped by a clone, as listed above. The entry also disappears with the error, so
 * there is nothing to clean up.
 */
const bridgedDecisions = new WeakMap<object, ErrorDecision>();

/** Record a decision computed before the error crossed a serialization boundary. */
export function setBridgedErrorDecision(error: unknown, decision: ErrorDecision): void {
    if (typeof error === 'object' && error !== null) {
        bridgedDecisions.set(error, decision);
    }
}

/** Read a decision recorded by `setBridgedErrorDecision`, if there is one. */
export function getBridgedErrorDecision(error: unknown): ErrorDecision | undefined {
    if (typeof error === 'object' && error !== null) {
        return bridgedDecisions.get(error);
    }
    return undefined;
}
