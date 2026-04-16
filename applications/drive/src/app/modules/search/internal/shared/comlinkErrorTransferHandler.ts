import * as Comlink from 'comlink';

type ThrownWrapper = { value: unknown };

/**
 * Override Comlink's built-in "throw" transfer handler to preserve Error.cause
 * across the postMessage boundary.
 *
 * Comlink manually serializes errors to { name, message, stack }, dropping
 * `cause` and any other properties. We bypass this by passing the Error
 * through as-is and letting postMessage preserve it intact:
 * the structured clone algorithm used by postMessage natively handles
 * Error objects including `cause` chains (Chrome 103+, Firefox 103+,
 * Safari 15.4+).
 *
 * Call once on both sides (worker + main thread) before any
 * Comlink.wrap / Comlink.expose call.
 *
 * Comlink has no official API for this — see https://github.com/GoogleChromeLabs/comlink/issues/594
 * Tested with comlink@4.4.2.
 */
export function registerComlinkErrorTransferHandler(): void {
    const existingThrowHandler = Comlink.transferHandlers?.get('throw');
    if (!existingThrowHandler) {
        return;
    }

    Comlink.transferHandlers.set('throw', {
        canHandle: existingThrowHandler.canHandle as (value: unknown) => value is ThrownWrapper,
        serialize(thrown: ThrownWrapper): [{ isError: boolean; value: unknown }, Transferable[]] {
            return [
                {
                    isError: thrown.value instanceof Error,
                    value: thrown.value,
                },
                [],
            ];
        },
        deserialize(serialized: { isError: boolean; value: unknown }): never {
            throw serialized.value;
        },
    });
}
