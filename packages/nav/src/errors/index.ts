/**
 * All errors thrown by this package extend `NavError`.
 * Catch `NavError` to handle any package error generically,
 * or catch a specific subclass for targeted handling.
 *
 * @example
 * import { NavError, DuplicateNavIdError } from "@proton/nav/errors";
 *
 * try {
 *   defineNavigation({ definition, context });
 * } catch (err) {
 *   if (err instanceof DuplicateNavIdError) {
 *     console.error("Duplicate ids:", err.ids);
 *   } else if (err instanceof NavError) {
 *     console.error("Nav error:", err.code, err.message);
 *   }
 * }
 */
export abstract class NavError extends Error {
    abstract readonly code: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// ---------------------------------------------------------------------------
// DuplicateNavIdError
// ---------------------------------------------------------------------------

/**
 * Thrown when one or more ids appear more than once anywhere in the definition tree.
 * Lists every offending id.
 */
export class DuplicateNavIdError extends NavError {
    readonly code = 'DUPLICATE_NAV_ID' as const;

    constructor(readonly ids: string[]) {
        const list = ids.map((id) => `"${id}"`).join(', ');
        super(
            `Nav item id${ids.length > 1 ? 's' : ''} ${list} ${ids.length > 1 ? 'are' : 'is'} used more than once. Nav item ids must be unique across the entire definition tree.`
        );
    }
}
