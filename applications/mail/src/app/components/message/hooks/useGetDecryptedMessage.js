import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { decryptMessageLegacy } from 'pmcrypto';
import { splitKeys } from 'proton-shared/lib/keys/keys';

const isMime = ({ MIMEType }) => MIMEType === MIME_TYPES.MIME;

// Reference: Angular/src/app/message/factories/messageModel.js decryptBody

export const useGetDecryptedMessage = () => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();

    // Cache result
    return useCallback(async (message) => {
        // Do it in //
        const { publicKeys = [] } = await getPublicKeys(message.Sender.Address);
        const addressKeys = await getAddressKeys(message.AddressID);
        const { privateKeys } = splitKeys(addressKeys);

        // TODO: filter out compromised addresses (if not done already)

        console.log('useGetMessageBody', message, message.MIMEType);

        if (isMime(message)) {
            // TODO: decrypt mime message
        } else {
            const decrypted = await decryptMessageLegacy({
                message: message.Body,
                messageDate: new Date(message.Time * 1000), // getDate(this),
                privateKeys,
                publicKeys
            });

            return decrypted.data;
        }

        return 'hi';
    });
};
