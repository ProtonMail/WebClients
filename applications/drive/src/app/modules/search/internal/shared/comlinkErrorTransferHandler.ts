import * as Comlink from 'comlink';

import { Logger } from './Logger';
import { setBridgedErrorDecision } from './bridgedErrorDecision';
import type { ErrorDecision } from './errors';
import { classifyError } from './errors';

type ThrownWrapper = { value: unknown };

/**
 * The wire payload. `decision` is optional because Comlink keeps one handler registry per JS
 * context, not one per connection: this override becomes the deserializer for every connection on
 * our side, including workers that never installed it and therefore send no decision.
 */
type SerializedThrow = { isError: boolean; value: unknown; decision?: ErrorDecision };

/**
 * Classify without ever throwing. If `serialize` throws, Comlink drops the real error and posts a
 * fabricated "Unserializable return value" TypeError in its place, destroying what we came to report.
 */
function classifySafely(value: unknown): ErrorDecision {
    try {
        return classifyError(value);
    } catch {
        Logger.error(`comlinkErrorTransferHandler: could not classify a thrown ${typeof value}`);
        return { kind: 'transient', reason: 'unknown' };
    }
}

/**
 * Override Comlink's built-in "throw" handler so errors survive the worker boundary.
 *
 * The built-in one rebuilds errors from { name, message, stack }, which loses the `cause` chain.
 * Passing the error through untouched instead lets postMessage's structured clone keep it
 * (Chrome 103+, Firefox 103+, Safari 15.4+).
 *
 * Structured clone still flattens identity: the subclass (e.g. SDKServerError) is lost, a custom `name`
 * (e.g. 'AbortError') becomes "Error", and own properties like `status` are dropped, so the receiver
 * cannot tell an offline blip from a 429 from a genuinely broken node. We therefore classify on the
 * throwing side, where the error is still whole, and send the decision beside it as a plain object,
 * which clones faithfully.
 *
 * Doing it here rather than per call site means it cannot be forgotten when someone adds a method
 * to the bridge, which is how the classification silently rotted before.
 *
 * Call once on each side before any wrap or expose. Comlink has no official API for this, see
 * https://github.com/GoogleChromeLabs/comlink/issues/594. Tested with comlink@4.4.2.
 */
export function registerComlinkErrorTransferHandler(): void {
    const existingThrowHandler = Comlink.transferHandlers?.get('throw');
    if (!existingThrowHandler) {
        return;
    }

    Comlink.transferHandlers.set('throw', {
        canHandle: existingThrowHandler.canHandle as (value: unknown) => value is ThrownWrapper,
        serialize(thrown: ThrownWrapper): [SerializedThrow, Transferable[]] {
            return [
                {
                    isError: thrown.value instanceof Error,
                    value: thrown.value,
                    // Materialize the classification decision while instanceof and
                    // own properties still hold.
                    decision: classifySafely(thrown.value),
                },
                [],
            ];
        },
        deserialize(serialized: SerializedThrow): never {
            if (serialized.decision) {
                // When crossing the comlink boundary and deserializing the payload,
                // associate together the decision to the deserialized payload (a thrown exception here).
                // This association can be used later to classify the exception.
                setBridgedErrorDecision(serialized.value, serialized.decision);
            }
            throw serialized.value;
        },
    });
}
