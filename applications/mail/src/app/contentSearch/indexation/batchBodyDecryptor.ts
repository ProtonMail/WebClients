import { decryptMessage } from '@proton/mail-message/helpers/message/messageDecrypt';
import type { GetMessageKeys } from '@proton/mail-message/store/messages/messagesTypes';

import type { BatchMessageDecryptionFunction } from './MailApiBridge';

/** decrypts the bodies returned by the batch route with the keys of the message's address */
export const createBatchBodyDecryptor = (getMessageKeys: GetMessageKeys): BatchMessageDecryptionFunction => {
    return async (batchMessage, messageMetadata) => {
        const addressKeys = await getMessageKeys(messageMetadata);
        const result = await decryptMessage(
            {
                ...batchMessage,
                Body: Uint8Array.fromBase64(batchMessage.Body),
                Flags: messageMetadata.Flags,
            },
            addressKeys.decryptionKeys
        );
        if (result.errors) {
            // should not reach sentry!
            throw new Error('search: message decryption failed', { cause: result.errors.decryption?.[0] });
        }
        return {
            decryptedBody: result.decryptedBody,
            decryptedSubject: result.decryptedSubject,
            mimeType: result.mimetype,
        };
    };
};
