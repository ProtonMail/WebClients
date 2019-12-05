import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { decryptMessageLegacy } from 'pmcrypto';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { VERIFICATION_STATUS } from '../constants';
import { MessageExtended } from '../models/message';
import { isMIME } from '../helpers/message';

// Reference: Angular/src/app/message/factories/messageModel.js decryptBody

export const useDecryptMessage = () => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();

    // TODO: Cache result
    return useCallback(
        async ({ data: message }: MessageExtended): Promise<MessageExtended> => {
            message = message || {};
            message.Sender = message.Sender || {};

            const [{ publicKeys = [] }, addressKeys] = await Promise.all([
                getPublicKeys(message.Sender.Address),
                getAddressKeys(message.AddressID)
            ]);
            const { privateKeys } = splitKeys(addressKeys) as any;

            // TODO: filter out compromised addresses (if not done already)

            if (isMIME(message)) {
                // TODO: decrypt mime message
                console.warn('Mime messages are not yet supported');
            } else {
                const {
                    data,
                    verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED
                } = (await decryptMessageLegacy({
                    message: message.Body,
                    messageDate: new Date((message.Time || 0) * 1000), // getDate(this),
                    privateKeys,
                    publicKeys
                })) as any;

                const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
                const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
                const verified =
                    !publicKeys.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;

                return { raw: data, verified, publicKeys, privateKeys };
            }

            return {};
        },
        [getPublicKeys, getAddressKeys]
    );
};
