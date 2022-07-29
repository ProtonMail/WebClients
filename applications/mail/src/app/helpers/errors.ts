import { ConversationErrors } from '../logic/conversations/conversationsTypes';
import { MessageErrors } from '../logic/messages/messagesTypes';

/**
 * Define wether or not the error comes from a network error
 * We have the ApiError type but we can miss some native connection errors
 * So (unless proven otherwise) the most reliable is to refer on error names
 * Knowing that ApiError also use error names
 */
export const isNetworkError = (error: any) =>
    error.name === 'NetworkError' || error.name === 'OfflineError' || error.name === 'TimeoutError';

export const isNotExistError = (error: any) =>
    error?.data &&
    (error.data.Code === 2061 || // invalid id
        error.data.Code === 2501 || // message does not exist
        error.data.Code === 20052); // conversation does not exist

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
