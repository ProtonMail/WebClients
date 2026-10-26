import { withScope } from '@sentry/browser';
import type { Scope, SeverityLevel } from '@sentry/types';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry';
import type { FeatureFlag } from '@proton/unleash/Flags';

import { getChargebeeErrorCode } from '../core/chargebee-errors';
import type { FreeSubscription, PaymentMethodType } from '../core/interface';
import type { Subscription } from '../core/subscription/interface';
import { isSavedPaymentMethod } from '../core/type-guards';
import { type PaymentErrorInfo, getPaymentErrorInfo } from './errorInfo';
import { getSubscriptionKeys } from './subscriptionKey';

/**
 * The place a payment error was reported from. Kept as a closed union so that the `component` tag
 * stays usable as a Sentry grouping and filtering key. The values match the ones that were already
 * being reported, so existing Sentry searches keep working.
 */
export type PaymentsComponent =
    | 'account-lite-subscription-checkout-payment-section'
    | 'chargebee-iframe'
    | 'create-payment-subscription'
    | 'create-payment-token'
    | 'credits-modal'
    | 'drive-ctx-payment-step'
    | 'edit-card-modal'
    | 'meet-b2c-plan-ctx-payment-step'
    | 'pass-ctx-payment-step'
    | 'pay-invoice-modal'
    | 'payments-helpers'
    | 'referral-ctx-payment-step'
    | 'single-signup-v1-step1'
    | 'single-signup-v2-account-step-payment'
    | 'subscription-container'
    | 'subscription-modal-provider'
    | 'use-chargebee-wallet'
    | 'use-methods';

export interface PaymentsCaptureOptions {
    component: PaymentsComponent;
    /**
     * The user's current subscription, reported as a `{planName}-{currency}-{cycle}` key.
     * Free and signup users are reported as `null`.
     */
    subscription?: Subscription | FreeSubscription | null | undefined;
    level?: SeverityLevel;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
    /** Flag gating the code path that raised the error: prefixes the title and splits off the Sentry issue. */
    featureFlag?: FeatureFlag;
}

const CHARGEBEE_SDK_CONNECTIVITY_ERROR_CODES = [
    'ERR_NETWORK',
    'ECONNABORTED',
    'empty_response',
    'replyTimeout',
    'scriptError',
];

function isChargebeeConnectivityError(error: unknown) {
    const code = getChargebeeErrorCode(error);
    return !!code && CHARGEBEE_SDK_CONNECTIVITY_ERROR_CODES.includes(code);
}

const isReportable = (error: unknown) => !!getSentryError(error) && !isChargebeeConnectivityError(error);

function neverThrow(run: () => void) {
    try {
        run();
    } catch {}
}

const PAYMENT_METHOD_EXTRA_KEYS = ['paymentMethodValue', 'paymentMethodId'];

function withoutSavedPaymentMethodId(extra: Record<string, unknown>) {
    const redacted = { ...extra };

    for (const key of PAYMENT_METHOD_EXTRA_KEYS) {
        const value = redacted[key];
        if (typeof value === 'string' && isSavedPaymentMethod(value as PaymentMethodType)) {
            redacted[key] = 'saved';
        }
    }

    return redacted;
}

function withPaymentScope(options: PaymentsCaptureOptions, run: (scope: Scope) => void) {
    const { component, subscription, level, extra, tags, featureFlag } = options;
    const { subscriptionKey, upcomingSubscriptionKey } = getSubscriptionKeys(subscription);

    withScope((scope) => {
        scope.setTransactionName(`payments/${component}`);

        if (extra) {
            scope.setExtras(withoutSavedPaymentMethodId(extra));
        }

        if (level) {
            scope.setLevel(level);
        }

        if (tags) {
            scope.setTags(tags);
        }
        scope.setTag('scope', 'payments');
        scope.setTag('subscriptionKey', subscriptionKey);
        scope.setTag('upcomingSubscriptionKey', upcomingSubscriptionKey);
        scope.setTag('component', component);

        if (featureFlag) {
            scope.setTag('featureFlag', featureFlag);
        }

        run(scope);
    });
}

function withFeatureFlagPrefix(text: string, featureFlag: FeatureFlag | undefined) {
    return featureFlag ? `[${featureFlag}] ${text}` : text;
}

function getFingerprint({ component, featureFlag }: PaymentsCaptureOptions, name: string, message: string) {
    return ['payments', component, ...(featureFlag ? [featureFlag] : []), name, message];
}

/**
 * `beforeSend` discards anything whose original exception is an `ApiError`, and non-Error
 * throwables lose their reason to Sentry's "Object captured as exception" fallback. Both cases are
 * replaced by a synthetic error carrying the resolved name and message. So is a flagged error, whose
 * name gets the flag prefix without mutating the caller's error.
 */
function toCapturableError(exception: unknown, info: PaymentErrorInfo, featureFlag: FeatureFlag | undefined): Error {
    if (exception instanceof Error && !(exception instanceof ApiError) && !featureFlag) {
        return exception;
    }

    const error = new Error(info.message);
    error.name = withFeatureFlagPrefix(info.name, featureFlag);

    // Carrying the stack over points the event at the original throw site rather than at this
    // helper. The title still comes from name/message, not from the stack.
    if (exception instanceof Error && exception.stack) {
        error.stack = exception.stack;
    }

    return error;
}

/**
 * Both capture functions group on `['payments', component, errorName, message]`. Changing the
 * shape re-groups every existing issue, which resets its resolved/ignored/assigned state, so keep
 * volatile values (ids, amounts, correlation ids) out of it — those belong in tags and extras.
 */
export function tracePaymentError(exception: unknown, options: PaymentsCaptureOptions) {
    neverThrow(() => {
        if (!isReportable(exception)) {
            return;
        }

        const info = getPaymentErrorInfo(exception);

        withPaymentScope(options, (scope) => {
            scope.setFingerprint(getFingerprint(options, info.name, info.message));
            scope.setExtras(info.extra);
            traceError(toCapturableError(exception, info, options.featureFlag));
        });
    });
}

export function capturePaymentMessage(message: string, options: PaymentsCaptureOptions, cause?: unknown) {
    neverThrow(() => {
        if (cause !== undefined && !isReportable(cause)) {
            return;
        }

        const info = cause !== undefined ? getPaymentErrorInfo(cause) : undefined;

        withPaymentScope(options, (scope) => {
            scope.setFingerprint(getFingerprint(options, info?.name ?? '', message));

            if (info) {
                scope.setExtras(info.extra);
            }

            const title = info ? `${message} – ${info.name}: ${info.message}` : message;
            captureMessage(withFeatureFlagPrefix(title, options.featureFlag));
        });
    });
}
