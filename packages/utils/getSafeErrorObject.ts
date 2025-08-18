/* eslint @typescript-eslint/no-use-before-define: 0 */

/**
 * Returns `true` if the passed parameter is an `Error`.
 */
export const isError = (e: unknown): e is Error =>
    e instanceof Error ||
    (!!e &&
        typeof e === 'object' &&
        'name' in e &&
        typeof e.name === 'string' &&
        'message' in e &&
        typeof e.message === 'string');

type SafeValue = string | number | boolean | undefined | null | SafeObject | SafeValue[];
type SafeObject = { [key: string]: SafeValue };
export type SafeErrorObject = {
    name: string;
    message: string;
    stack?: string;

    // Used by Drive errors
    isEnrichedError?: boolean;
    context?: SafeObject;
    sentryMessage?: string;
};

/**
 * Transforms an arbitrary value into something that is safe to transfer through `postMessage`.
 */
export function getSafeValue(value: any): SafeValue {
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === undefined ||
        value === null
    ) {
        return value;
    }

    if (isError(value)) {
        return getSafeErrorObject(value);
    }

    if (Array.isArray(value)) {
        return getSafeArray(value);
    }

    if (typeof value === 'object') {
        return getSafeObject(value);
    }

    return undefined;
}

/**
 * Returns an array of objects that is safe to transfer through `postMessage`.
 *
 * Some elements may be transformed into `undefined` if they are not safe.
 */
export function getSafeArray(value: any[]): SafeValue[] {
    return value.map(getSafeValue);
}

/**
 * Returns an object that is safe to transfer through `postMessage`.
 */
export function getSafeObject(obj: any): SafeObject | undefined {
    if (typeof obj !== 'object') {
        return undefined;
    }

    const result: SafeObject = {};

    Object.entries(obj).forEach(([key, value]) => {
        const safeValue = getSafeValue(value);

        if (safeValue !== undefined) {
            result[key] = safeValue;
        }
    });

    return result;
}

/**
 * Returns a safe Error-like object that can be transferred through `postMessage`.
 * Mainly needed because Safari <= 16 errors when cloning Error objects.
 */
export function getSafeErrorObject(error: Error): SafeErrorObject {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,

        // Used by Drive errors to provide additional data to Sentry
        isEnrichedError: (error as any).isEnrichedError,
        context: getSafeObject((error as any).context),
        sentryMessage: (error as any).sentryMessage,
    };
}
