import { isMessageBusResponseFailure } from '@proton/chargebee/lib/types';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';

/**
 * A thrown value reduced to the two strings Sentry renders as an issue title (`name: message`),
 * plus whatever structured detail was found along the way.
 */
export interface PaymentErrorInfo {
    name: string;
    message: string;
    extra: Record<string, unknown>;
}

const MAX_MESSAGE_LENGTH = 250;

const truncate = (message: string) =>
    message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message;

const firstNonEmptyString = (...candidates: unknown[]): string | undefined =>
    candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== '');

const getApiErrorInfo = (error: ApiError): PaymentErrorInfo => {
    const { code, message, details, status } = getApiError(error);

    return {
        name: code !== undefined ? `PaymentsApiError ${code}` : `PaymentsApiError HTTP ${status ?? 'unknown'}`,
        message: firstNonEmptyString(message, error.message) ?? 'API request failed',
        extra: { apiCode: code, httpStatus: status, apiDetails: details },
    };
};

/**
 * Chargebee iframe failures arrive over the message bus as plain objects, never as Errors:
 * `{ status: 'failure', type, correlationId, error: { code, name, type, message } }`.
 *
 * The failure type also declares `data?: any`, which is deliberately not forwarded: no failure
 * message populates it, and blanket-forwarding an `any` straight from the iframe into Sentry is
 * not worth the risk. Call sites that want it pass it themselves, as `getBin` does.
 */
const getMessageBusErrorInfo = (failure: any): PaymentErrorInfo => {
    const { error, type, correlationId } = failure;

    return {
        name: firstNonEmptyString(error?.code, error?.name, error?.type) ?? 'ChargebeeError',
        message:
            firstNonEmptyString(typeof error === 'string' ? error : undefined, error?.message, error?.displayMessage) ??
            'Chargebee reported a failure without a message',
        extra: {
            messageType: type,
            correlationId,
            chargebeeErrorCode: error?.code,
            chargebeeErrorName: error?.name,
            chargebeeErrorType: error?.type,
            chargebeeErrorDetail: error?.detail,
        },
    };
};

const getPlainObjectErrorInfo = (error: any): PaymentErrorInfo => {
    const name = firstNonEmptyString(error.code, error.name, error.type) ?? 'UnknownPaymentError';
    const message = firstNonEmptyString(error.message, error.displayMessage, error.Error, error.detail);

    if (message) {
        return { name, message, extra: {} };
    }

    return {
        name: 'UnknownPaymentError',
        message: `Non-error thrown with keys: ${Object.keys(error).sort().join(', ')}`,
        extra: {},
    };
};

/**
 * Reduces any thrown value to a title Sentry can group on. Without this, non-Error throwables
 * all collapse into "Object captured as exception with keys: …" and the real reason ends up
 * buried in the serialised payload.
 */
export const getPaymentErrorInfo = (exception: unknown): PaymentErrorInfo => {
    const info = (() => {
        if (exception instanceof ApiError) {
            return getApiErrorInfo(exception);
        }

        if (exception instanceof Error) {
            return {
                name: firstNonEmptyString(exception.name) ?? 'Error',
                message: firstNonEmptyString(exception.message) ?? 'Error thrown without a message',
                extra: {},
            };
        }

        if (isMessageBusResponseFailure(exception)) {
            return getMessageBusErrorInfo(exception);
        }

        if (typeof exception === 'string') {
            return { name: 'PaymentError', message: exception, extra: {} };
        }

        if (exception !== null && typeof exception === 'object') {
            return getPlainObjectErrorInfo(exception);
        }

        return { name: 'UnknownPaymentError', message: `Non-error thrown: ${String(exception)}`, extra: {} };
    })();

    return { ...info, message: truncate(info.message) };
};
