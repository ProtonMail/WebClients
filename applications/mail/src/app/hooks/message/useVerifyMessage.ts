import { useCallback } from 'react';

import { useApi, useGetVerificationPreferences } from '@proton/components';
import { PublicKeyReference, WorkerDecryptionResult, getMatchingSigningKey } from '@proton/crypto';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { isNetworkError } from '../../helpers/errors';
import { verifyMessage } from '../../helpers/message/messageDecrypt';
import { extractKeysFromAttachments, extractKeysFromAutocrypt } from '../../helpers/message/messageKeys';
import { updateAttachment } from '../../store/attachments/attachmentsActions';
import { MessageErrors, MessageStateWithDataFull } from '../../store/messages/messagesTypes';
import { verificationComplete } from '../../store/messages/read/messagesReadActions';
import { useGetAttachment } from '../attachments/useAttachment';
import { useContactsMap } from '../contact/useContacts';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useVerifyMessage = (localID: string) => {
    const api = useApi();
    const getMessage = useGetMessage();
    const getAttachment = useGetAttachment();
    const dispatch = useMailDispatch();
    const getVerificationPreferences = useGetVerificationPreferences();
    const getMessageKeys = useGetMessageKeys();
    const contactsMap = useContactsMap();

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
        async (
            decryptedRawContent: Uint8Array = new Uint8Array(),
            signature?: Uint8Array,
            decryptionErrors?: Error[]
        ) => {
            // Message can change during the whole sequence
            // To have the most up to date version, best is to get back to the cache version each time
            const getData = () => (getMessage(localID) as MessageStateWithDataFull).data;

            const errors: MessageErrors = {};

            if (decryptionErrors && decryptionErrors?.length) {
                dispatch(
                    verificationComplete({
                        ID: localID,
                        verification: {
                            verified: VERIFICATION_STATUS.SIGNED_AND_INVALID,
                            verificationErrors: [new Error('message decryption failure')],
                        },
                    })
                );
                return;
            }

            let verificationPreferences;
            let verification;
            let signingPublicKey: PublicKeyReference | undefined;
            let attachedPublicKeys: PublicKeyReference[] | undefined;

            try {
                const senderAddress = getData().Sender.Address;

                verificationPreferences = await getVerificationPreferences({
                    email: senderAddress,
                    lifetime: 0,
                    contactEmailsMap: contactsMap,
                });

                const messageKeys = await getMessageKeys(getData());

                verification = await verifyMessage(
                    decryptedRawContent,
                    signature,
                    getData(),
                    verificationPreferences.verifyingKeys
                );

                const messageData = getData();
                attachedPublicKeys = await extractKeysFromAttachments(
                    messageData.Attachments,
                    messageKeys,
                    getAttachment,
                    onUpdateAttachment,
                    api,
                    messageData.Flags
                );
                const autocryptKeys = await extractKeysFromAutocrypt(getData().ParsedHeaders, senderAddress);

                const allSenderPublicKeys = [
                    ...verificationPreferences.apiKeys,
                    ...verificationPreferences.pinnedKeys,
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
                        verificationPreferences,
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
