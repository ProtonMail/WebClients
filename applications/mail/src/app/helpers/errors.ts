import type { MessageErrors, MessageState } from '@proton/mail/store/messages/messagesTypes';

import type { ConversationErrors } from '../store/conversations/conversationsTypes';

/**
 * Define wether or not the error comes from a network error
 * We have the ApiError type but we can miss some native connection errors
 * So (unless proven otherwise) the most reliable is to refer on error names
 * Knowing that ApiError also use error names
 */
export const isNetworkError = (error: any) =>
    error.name === 'NetworkError' || error.name === 'OfflineError' || error.name === 'TimeoutError';

/**
 * It's an error from OpenPGP about decryption
 * Most of the time decryption errors are user key management pbs we have to ignore
 */
export const isDecryptionError = (error: any) => error.message && error.message.startsWith('Error decrypting');

export const hasError = (errors: MessageErrors | ConversationErrors | undefined = {}) =>
    !!Object.values(errors).flat().length;

export const hasErrorType = (
    errors: MessageErrors | ConversationErrors | undefined = {},
    errorType: keyof MessageErrors | keyof ConversationErrors
) => ((errors as any)?.[errorType]?.length || 0) > 0;

export const pickMessageInfosForSentry = ({ localID, loadRetry, errors }: MessageState) => {
    // We don't want to send everything to Sentry, we need to remove sensitive information
    // e.g. messageDocument, decryption, errors.decryption, etc...
    return {
        localID,
        loadRetry,
        errors: {
            network: errors?.network,
            processing: errors?.processing,
            signature: errors?.signature,
            unknown: errors?.unknown,
        },
    };
};
