import type { CaptureContext } from '@sentry/types';

import { SafeErrorObject } from '@proton/utils/getSafeErrorObject';

export const isEnrichedError = (err: any): err is EnrichedError => {
    return err.name === 'EnrichedError';
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
    context?: CaptureContext;

    constructor(message: string, context?: CaptureContext) {
        super(message);
        this.name = 'EnrichedError';
        this.context = context;
    }
}

/**
 * Converts a `SafeErrorObject` to the appropriate `Error` or `EnrichedError`.
 */
export const convertSafeError = (obj: SafeErrorObject) => {
    let error;

    if (obj.name === 'EnrichedError') {
        error = new EnrichedError(obj.message, obj.context);
    } else {
        error = new Error(obj.message);
    }
    error.name = obj.name;
    error.stack = obj.stack;

    return error;
};
