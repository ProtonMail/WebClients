import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { MessageExtended } from '../models/message';
import { isMIME } from '../helpers/message/messages';
import { decryptLegacyMessage, decryptMimeMessage } from '../helpers/message/messageDecrypt';
import { useAttachmentsCache } from './useAttachments';

// Reference: Angular/src/app/message/factories/messageModel.js decryptBody

export const useDecryptMessage = () => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();
    const attachmentsCache = useAttachmentsCache();

    return useCallback(
        async ({ data: message = {} }: MessageExtended): Promise<MessageExtended> => {
            const [{ publicKeys = [] }, addressKeys] = await Promise.all([
                getPublicKeys((message.Sender || {}).Address),
                getAddressKeys(message.AddressID)
            ]);
            const { privateKeys } = splitKeys(addressKeys) as any;

            // TODO: filter out compromised addresses (if not done already)

            if (isMIME(message)) {
                return decryptMimeMessage(message, privateKeys, publicKeys, attachmentsCache.data);
            }

            return decryptLegacyMessage(message, privateKeys, publicKeys);
        },
        [getPublicKeys, getAddressKeys, attachmentsCache]
    );
};
