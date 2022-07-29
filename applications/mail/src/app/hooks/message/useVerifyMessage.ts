import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { PublicKeyReference, WorkerDecryptionResult, getMatchingSigningKey } from '@proton/crypto';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { isNetworkError } from '../../helpers/errors';
import { verifyMessage } from '../../helpers/message/messageDecrypt';
import { extractKeysFromAttachments, extractKeysFromAutocrypt } from '../../helpers/message/messageKeys';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { MessageErrors, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { verificationComplete } from '../../logic/messages/read/messagesReadActions';
import { useContactsMap } from '../contact/useContacts';
import { useGetAttachment } from '../useAttachment';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useVerifyMessage = (localID: string) => {
    const api = useApi();
    const getMessage = useGetMessage();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessageKeys = useGetMessageKeys();
    const contactsMap = useContactsMap();

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
        async (decryptedRawContent: Uint8Array = new Uint8Array(), signature?: Uint8Array) => {
            // Message can change during the whole sequence
            // To have the most up to date version, best is to get back to the cache version each time
            const getData = () => (getMessage(localID) as MessageStateWithData).data;

            const errors: MessageErrors = {};

            let encryptionPreferences;
            let verification;
            let signingPublicKey: PublicKeyReference | undefined;
            let attachedPublicKeys: PublicKeyReference[] | undefined;

            try {
                const senderAddress = getData().Sender.Address;

                encryptionPreferences = await getEncryptionPreferences(senderAddress, 0, contactsMap);

                const messageKeys = await getMessageKeys(getData());

                verification = await verifyMessage(
                    decryptedRawContent,
                    signature,
                    getData(),
                    encryptionPreferences.verifyingPinnedKeys
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
                        ? await getMatchingSigningKey({
                              binarySignature: verification.signature,
                              keys: allSenderPublicKeys,
                          })
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
