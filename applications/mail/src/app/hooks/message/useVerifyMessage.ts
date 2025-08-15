import { useCallback } from 'react';

import { useGetUserSettings } from '@proton/account';
import { useApi, useGetVerificationPreferences } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { getMatchingSigningKey } from '@proton/crypto';
import type { MessageErrors, MessageStateWithDataFull } from '@proton/mail/store/messages/messagesTypes';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { isNetworkError } from '../../helpers/errors';
import { verifyMessage } from '../../helpers/message/messageDecrypt';
import { extractKeysFromAttachments, extractKeysFromAutocrypt } from '../../helpers/message/messageKeys';
import { updateAttachment } from '../../store/attachments/attachmentsActions';
import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';
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
    const getUserSettings = useGetUserSettings();

    const onUpdateAttachment = (ID: string, attachment: DecryptedAttachment) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
        async (
            decryptedRawContent: Uint8Array<ArrayBuffer> = new Uint8Array(),
            signature?: Uint8Array<ArrayBuffer>,
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
                            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID,
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
                const supportV6Keys = (await getUserSettings()).Flags.SupportPgpV6Keys === 1;
                attachedPublicKeys = await extractKeysFromAttachments(
                    messageData.Attachments,
                    messageKeys,
                    getAttachment,
                    onUpdateAttachment,
                    api,
                    supportV6Keys,
                    messageData.Flags
                );
                const autocryptKeys = await extractKeysFromAutocrypt(
                    getData().ParsedHeaders,
                    senderAddress,
                    supportV6Keys
                );

                const allSenderPublicKeys = [
                    ...verificationPreferences.apiKeys,
                    ...verificationPreferences.pinnedKeys,
                    ...attachedPublicKeys,
                    ...autocryptKeys,
                ];

                const signed = verification.verificationStatus !== MAIL_VERIFICATION_STATUS.NOT_SIGNED;
                signingPublicKey =
                    signed && verification.signature
                        ? await getMatchingSigningKey({
                              binarySignature: verification.signature,
                              keys: allSenderPublicKeys,
                              preferV6Key: supportV6Keys,
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
