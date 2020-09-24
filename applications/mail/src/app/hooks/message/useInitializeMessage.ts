import { arrayToBinaryString, getKeys, getMatchingKey } from 'pmcrypto';
import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences, useMailSettings } from 'react-components';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { LARGE_KEY_SIZE, VERIFICATION_STATUS } from '../../constants';
import { get } from '../../helpers/attachment/attachmentLoader';
import { MessageExtended, Message, MessageErrors, MessageExtendedWithData } from '../../models/message';
import { loadMessage } from '../../helpers/message/messageRead';
import { useMessageKeys } from './useMessageKeys';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { prepareMailDocument } from '../../helpers/transforms/transforms';
import { isApiError } from '../../helpers/errors';
import { useBase64Cache } from '../useBase64Cache';
import { isPlainText } from '../../helpers/message/messages';
import { useMarkAs, MARK_AS_STATUS } from './../useMarkAs';
import { isUnreadMessage } from '../../helpers/elements';
import { hasShowEmbedded } from '../../helpers/settings';
import { useLoadEmbeddedImages } from './useLoadImages';

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const messageCache = useMessageCache();
    const getMessageKeys = useMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const loadEmbeddedImages = useLoadEmbeddedImages(localID);

    return useCallback(async () => {
        // Message can change during the whole initilization sequence
        // To have the most up to date version, best is to get back to the cache version each time
        const getData = () => (messageCache.get(localID) as MessageExtendedWithData).data;

        // Cache entry will be (at least) initialized by the queue system
        const messageFromCache = messageCache.get(localID) as MessageExtended;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromCache || !messageFromCache.data) {
            messageFromCache.data = { ID: localID } as Message;
        }

        updateMessageCache(messageCache, localID, { initialized: false });

        const errors: MessageErrors = {};

        let encryptionPreferences,
            userKeys,
            decryption,
            signingPublicKey,
            attachedPublicKeys,
            verificationStatus,
            preparation,
            dataChanges;

        try {
            // Ensure the message data is loaded
            const message = await loadMessage(messageFromCache, api);
            updateMessageCache(messageCache, localID, { data: message.data });

            dataChanges = {} as Partial<Message>;

            encryptionPreferences = await getEncryptionPreferences(getData().Sender.Address as string);
            userKeys = await getMessageKeys(message);
            const messageWithKeys = {
                ...message,
                publicKeys: encryptionPreferences.pinnedKeys,
                privateKeys: userKeys.privateKeys
            };

            // To verify the signature of the message, we can only use pinned keys
            // API keys could always be forged by the server to verify the signature
            decryption = await decryptMessage(
                getData(),
                encryptionPreferences.pinnedKeys,
                userKeys.privateKeys,
                attachmentsCache
            );
            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.Attachments || [];
            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = { ...dataChanges, Attachments: allAttachments, NumAttachments: allAttachments.length };
            const keyAttachments =
                allAttachments.filter(
                    ({ Name, Size }) => splitExtension(Name)[1] === 'asc' && (Size || 0) < LARGE_KEY_SIZE
                ) || [];
            attachedPublicKeys = (
                await Promise.all(
                    keyAttachments.map(async (attachment) => {
                        try {
                            const { data } = await get(attachment, messageWithKeys, attachmentsCache, api);
                            const [key] = await getKeys(arrayToBinaryString(data));
                            return key;
                        } catch (e) {
                            return;
                        }
                    })
                )
            ).filter(isTruthy);

            const allSenderPublicKeys = [
                ...encryptionPreferences.pinnedKeys,
                ...encryptionPreferences.apiKeys,
                ...attachedPublicKeys
            ];

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);
            }

            const signed = decryption.verified !== VERIFICATION_STATUS.NOT_SIGNED;
            signingPublicKey =
                signed && decryption.signature
                    ? await getMatchingKey(decryption.signature, allSenderPublicKeys)
                    : undefined;
            verificationStatus = decryption.verified;

            if (isUnreadMessage(getData())) {
                await markAs([getData()], labelID, MARK_AS_STATUS.READ);
                dataChanges = { ...dataChanges, Unread: 0 };
            }

            preparation = isPlainText(getData())
                ? ({ plainText: decryption.decryptedBody } as any)
                : await prepareMailDocument(
                      { ...messageWithKeys, decryptedBody: decryption.decryptedBody },
                      base64Cache,
                      attachmentsCache,
                      api,
                      mailSettings
                  );
        } catch (error) {
            if (isApiError(error)) {
                errors.network = error;
            } else {
                errors.common = error;
            }
        } finally {
            updateMessageCache(messageCache, localID, {
                data: dataChanges,
                document: preparation?.document,
                plainText: preparation?.plainText,
                senderPinnedKeys: encryptionPreferences?.pinnedKeys,
                signingPublicKey,
                attachedPublicKeys,
                senderVerified: encryptionPreferences?.isContactSignatureVerified,
                publicKeys: userKeys?.publicKeys,
                privateKeys: userKeys?.privateKeys,
                decryptedBody: decryption?.decryptedBody,
                verificationStatus,
                verificationErrors: decryption?.verificationErrors,
                decryptedSubject: decryption?.decryptedSubject,
                // Anticipate showEmbedded flag while triggering the load just after
                showEmbeddedImages: preparation?.showEmbeddedImages || hasShowEmbedded(mailSettings),
                showRemoteImages: preparation?.showRemoteImages,
                embeddeds: preparation?.embeddeds,
                errors,
                initialized: true
            });
        }

        if (hasShowEmbedded(mailSettings)) {
            // Load embedded images as a second step not synchronized with the initialization
            // To prevent slowing the message body when there is heavy embedded attachments
            loadEmbeddedImages();
        }
    }, [localID]);
};
