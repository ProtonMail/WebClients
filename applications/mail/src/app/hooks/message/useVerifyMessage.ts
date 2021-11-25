import { DecryptResultPmcrypto, getMatchingKey, OpenPGPSignature } from 'pmcrypto';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { useDispatch } from 'react-redux';
import { verifyMessage } from '../../helpers/message/messageDecrypt';
import { useGetMessageKeys } from './useGetMessageKeys';
import { extractKeysFromAttachments, extractKeysFromAutocrypt } from '../../helpers/message/messageKeys';
import { isNetworkError } from '../../helpers/errors';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';
import { MessageErrors, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessage } from './useMessage';
import { verificationComplete } from '../../logic/messages/read/messagesReadActions';
import { useContactsMap } from '../contact/useContacts';

export const useVerifyMessage = (localID: string) => {
    const api = useApi();
    const getMessage = useGetMessage();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessageKeys = useGetMessageKeys();
    const contactsMap = useContactsMap();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
        async (decryptedRawContent: Uint8Array = new Uint8Array(), signature?: OpenPGPSignature) => {
            // Message can change during the whole sequence
            // To have the most up to date version, best is to get back to the cache version each time
            const getData = () => (getMessage(localID) as MessageStateWithData).data;

            const errors: MessageErrors = {};

            let encryptionPreferences;
            let verification;
            let signingPublicKey;
            let attachedPublicKeys;

            try {
                const senderAddress = getData().Sender.Address;

                encryptionPreferences = await getEncryptionPreferences(senderAddress, 0, contactsMap);

                const messageKeys = await getMessageKeys(getData());

                verification = await verifyMessage(
                    decryptedRawContent,
                    signature,
                    getData(),
                    encryptionPreferences.pinnedKeys
                );

                attachedPublicKeys = await extractKeysFromAttachments(
                    getData().Attachments,
                    messageKeys,
                    getAttachment,
                    onUpdateAttachment,
                    api
                );
                const autocryptKeys = await extractKeysFromAutocrypt(getData().ParsedHeaders, senderAddress);

                const allSenderPublicKeys = [
                    ...encryptionPreferences.pinnedKeys,
                    ...encryptionPreferences.apiKeys,
                    ...attachedPublicKeys,
                    ...autocryptKeys,
                ];

                const signed = verification.verified !== VERIFICATION_STATUS.NOT_SIGNED;
                signingPublicKey =
                    signed && verification.signature
                        ? await getMatchingKey(verification.signature, allSenderPublicKeys)
                        : undefined;
            } catch (error: any) {
                if (isNetworkError(error)) {
                    errors.network = [error];
                } else {
                    errors.signature = [error];
                }
            } finally {
                dispatch(
                    verificationComplete({
                        ID: localID,
                        encryptionPreferences,
                        verification,
                        signingPublicKey,
                        attachedPublicKeys,
                        errors,
                    })
                );
            }
        },
        [localID, contactsMap]
    );
};
