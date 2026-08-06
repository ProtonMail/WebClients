/**
 * The errors a handler throws to reach the model. The engine catches these and feeds the message back
 * verbatim so the model can correct itself; anything else surfaces as a generic failure it cannot act on.
 */
/** Thrown by a handler when a param cites a reference the `ReferenceRegistry` never issued. */
export class UnknownReferenceError extends Error {
    constructor(public readonly reference: string) {
        super(`Unknown reference "${reference}" — it was not returned by any earlier tool.`);
        this.name = 'UnknownReferenceError';
    }
}

/**
 * Thrown by a handler when a param the MODEL chose is unusable (an unreadable date, an unknown token).
 * The message reaches the model verbatim, so it must name what was wrong and what to send instead; a
 * plain Error is reported as a generic failure the model cannot correct, and it re-issues the same call.
 */
export class ToolInputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ToolInputError';
    }
}
