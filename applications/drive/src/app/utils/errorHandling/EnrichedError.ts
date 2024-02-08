import type { CaptureContext } from '@sentry/types';

import { SafeErrorObject } from '@proton/utils/getSafeErrorObject';

export const isEnrichedError = (err: unknown): err is EnrichedError => {
    return (
        err instanceof EnrichedError ||
        (!!err &&
            typeof err === 'object' &&
            'name' in err &&
            typeof err.name === 'string' &&
            'message' in err &&
            typeof err.message === 'string' &&
            'isEnrichedError' in err &&
            err.isEnrichedError === true)
    );
};

/**
 * This error is used when wanting to pass extra information to Sentry.
 *
 * JavaScript errors offer the `cause` property to provide extra information,
 * however there is a `core-js` bug in the version we use which can cause
 * crashes when the Error object gets cloned. Hence, this custom error.
 *
 * We can use these properties from Sentry's `CaptureContext`:
 * - `tags`, which are searchable, and must be primitives
 * - `extra`, which can be structured data
 */
export class EnrichedError extends Error {
    isEnrichedError: boolean = true;

    context?: CaptureContext;

    constructor(message: string, context?: CaptureContext) {
        super(message);

        // It is important that the name is "Error", as we want it
        // to be compatible with existing handlers, and mitigate
        // the chances of the actual name showing in the UI
        this.name = 'Error';

        this.context = context;
    }
}

/**
 * Converts a `SafeErrorObject` to the appropriate `Error` or `EnrichedError`.
 */
export const convertSafeError = (obj: SafeErrorObject) => {
    let error;

    if (isEnrichedError(obj)) {
        error = new EnrichedError(obj.message, obj.context);
    } else {
        error = new Error(obj.message);
    }
    error.name = obj.name;
    error.stack = obj.stack;

    return error;
};
