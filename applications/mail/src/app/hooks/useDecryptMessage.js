import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { decryptMessageLegacy } from 'pmcrypto';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { VERIFICATION_STATUS } from '../constants';

const isMime = ({ MIMEType }) => MIMEType === MIME_TYPES.MIME;

// Reference: Angular/src/app/message/factories/messageModel.js decryptBody

export const useDecryptMessage = () => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();

    // Cache result
    return useCallback(async ({ data: message }) => {
        const [{ publicKeys = [] }, addressKeys] = await Promise.all([
            getPublicKeys(message.Sender.Address),
            getAddressKeys(message.AddressID)
        ]);
        const { privateKeys } = splitKeys(addressKeys);

        // TODO: filter out compromised addresses (if not done already)

        if (isMime(message)) {
            // TODO: decrypt mime message
        } else {
            const { data, verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED } = await decryptMessageLegacy({
                message: message.Body,
                messageDate: new Date(message.Time * 1000), // getDate(this),
                privateKeys,
                publicKeys
            });

            const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
            const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
            const verified = !publicKeys.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;

            return { raw: data, verified, publicKeys, privateKeys };
        }

        return {};
    });
};
