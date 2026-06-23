import type { MessageFailure, MessageSuccess } from 'proton-pass-extension/types/messages';

export const successMessage = <T extends {}>(message?: T) =>
    ({ type: 'success', ...(message ?? {}) }) as MessageSuccess<T>;

export const errorMessage = (error?: string): MessageFailure => ({
    type: 'error',
    error: error ?? 'unknown error',
    payload: error /* needed for Proton Account auth-ext page */,
});

export const resolveMessageResponse = (res: unknown) => {
    if (typeof res === 'boolean' || res === undefined) {
        if (res === false) throw new Error('Message handler returned a failure');
        return successMessage({});
    }

    return successMessage(res as {});
};
