import { useCallback } from 'react';
import { MessageExtended } from '../models/message';
import { isMIME } from '../helpers/message/messages';
import { decryptLegacyMessage, decryptMimeMessage } from '../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';

// Reference: Angular/src/app/message/factories/messageModel.js decryptBody

export const useDecryptMessage = () => {
    const attachmentsCache = useAttachmentCache();

    return useCallback(
        async (message: MessageExtended): Promise<MessageExtended> => {
            if (isMIME(message.data)) {
                return decryptMimeMessage(message, attachmentsCache);
            }

            return decryptLegacyMessage(message);
        },
        [attachmentsCache]
    );
};
