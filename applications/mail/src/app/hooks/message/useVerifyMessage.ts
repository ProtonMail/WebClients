import { arrayToBinaryString, getKeys, getMatchingKey, OpenPGPSignature } from 'pmcrypto';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from 'react-components';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { LARGE_KEY_SIZE } from '../../constants';
import { get } from '../../helpers/attachment/attachmentLoader';
import { MessageErrors, MessageExtendedWithData } from '../../models/message';
import { verifyMessage } from '../../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useContactCache } from '../../containers/ContactProvider';

export const useVerifyMessage = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const attachmentsCache = useAttachmentCache();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessageKeys = useGetMessageKeys();
    const { contactsMap } = useContactCache();

    return useCallback(
        async (decryptedRawContent: string, signature?: OpenPGPSignature) => {
            // Message can change during the whole sequence
            // To have the most up to date version, best is to get back to the cache version each time
            const getData = () => (messageCache.get(localID) as MessageExtendedWithData).data;

            const errors: MessageErrors = {};

            let encryptionPreferences;
            let verification;
            let signingPublicKey;
            let attachedPublicKeys;
            let verificationStatus;

            try {
                encryptionPreferences = await getEncryptionPreferences(
                    getData().Sender.Address as string,
                    0,
                    contactsMap
                );

                const messageKeys = await getMessageKeys(getData());

                verification = await verifyMessage(
                    decryptedRawContent,
                    signature,
                    getData(),
                    encryptionPreferences.pinnedKeys
                );

                const keyAttachments =
                    getData().Attachments.filter(
                        ({ Name, Size }) => splitExtension(Name)[1] === 'asc' && (Size || 0) < LARGE_KEY_SIZE
                    ) || [];

                attachedPublicKeys = (
                    await Promise.all(
                        keyAttachments.map(async (attachment) => {
                            try {
                                const { data } = await get(attachment, undefined, messageKeys, attachmentsCache, api);
                                const [key] = await getKeys(arrayToBinaryString(data));
                                return key;
                            } catch (e) {
                                // Nothing
                            }
                        })
                    )
                ).filter(isTruthy);

                const allSenderPublicKeys = [
                    ...encryptionPreferences.pinnedKeys,
                    ...encryptionPreferences.apiKeys,
                    ...attachedPublicKeys,
                ];

                const signed = verification.verified !== VERIFICATION_STATUS.NOT_SIGNED;
                signingPublicKey =
                    signed && verification.signature
                        ? await getMatchingKey(verification.signature, allSenderPublicKeys)
                        : undefined;
                verificationStatus = verification.verified;
            } catch (error) {
                errors.common = [error];
            } finally {
                updateMessageCache(messageCache, localID, {
                    verification: {
                        senderPinnedKeys: encryptionPreferences?.pinnedKeys,
                        signingPublicKey,
                        attachedPublicKeys,
                        senderVerified: encryptionPreferences?.isContactSignatureVerified,
                        verificationStatus,
                        verificationErrors: verification?.verificationErrors,
                    },
                    errors,
                });
            }
        },
        [localID]
    );
};
