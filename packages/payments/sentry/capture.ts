import { withScope } from '@sentry/browser';
import type { ScopeContext } from '@sentry/types';

import { captureMessage, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry';

function withPaymentScope(hint: Partial<ScopeContext> | undefined, run: () => void) {
    withScope((scope) => {
        if (hint) {
            scope.update(hint);
        }
        scope.setTag('scope', 'payments');
        run();
    });
}

export function tracePaymentError(exception: unknown, hint?: Partial<ScopeContext>) {
    const sentryError = getSentryError(exception);
    if (!sentryError) {
        return;
    }
    withPaymentScope(hint, () => traceError(sentryError));
}

export function capturePaymentMessage(message: string, hint?: Partial<ScopeContext>, cause?: unknown) {
    if (cause !== undefined && !getSentryError(cause)) {
        return;
    }
    withPaymentScope(hint, () => captureMessage(message));
}
