import type { Middleware } from '@reduxjs/toolkit';

import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

// Send errors to Sentry to catch silent fails from reducers
export const errorMiddleware: Middleware = () => (next) => (action) => {
    try {
        return next(action);
    } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));

        // Only error message, trace and action type so that we don't send private user data
        traceInitiativeError(SentryMailInitiatives.MAIL_REDUX_ERRORS, {
            actionType: (action as { type?: string })?.type,
            error: error.message,
            stack: error.stack,
        });
    }
};
