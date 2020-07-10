import { arrayToBinaryString, getKeys, OpenPGPKey } from 'pmcrypto';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences, useMailSettings } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';
import { getMatchingKey } from 'pmcrypto';

import { LARGE_KEY_SIZE, VERIFICATION_STATUS } from '../constants';
import { get } from '../helpers/attachment/attachmentLoader';
import { MessageExtended, Message, MessageErrors } from '../models/message';
import { Element } from '../models/element';
import { loadMessage } from '../helpers/message/messageRead';
import { useMessageKeys } from './useMessageKeys';
import { decryptMessage } from '../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { prepareMailDocument } from '../helpers/transforms/transforms';
import { isApiError } from '../helpers/errors';
import { useBase64Cache } from './useBase64Cache';
import { isPlainText } from '../helpers/message/messages';
import { useMarkAs, MARK_AS_STATUS } from './useMarkAs';

export const useLoadMessage = (inputMessage: Message) => {
    const api = useApi();
    const messageCache = useMessageCache();

    return useCallback(async () => {
        const localID = inputMessage.ID || '';

        const messageFromCache = updateMessageCache(messageCache, localID, { data: inputMessage });

        // If the Body is already there, no need to send a request
        if (!messageFromCache.data?.Body) {
            const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
            updateMessageCache(messageCache, localID, { data: message as Message });
        }
    }, [inputMessage]);
};

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const messageCache = useMessageCache();
    const getMessageKeys = useMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(async () => {
        // Cache entry will be (at least) initialized by the queue system
        const messageFromCache = messageCache.get(localID) as MessageExtended;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromCache || !messageFromCache.data) {
            messageFromCache.data = { ID: localID } as Message;
        }

        updateMessageCache(messageCache, localID, { initialized: false });

        const errors: MessageErrors = {};

        let message,
            encryptionPreferences,
            userKeys,
            decryption,
            signingPublicKey,
            attachedPublicKeys,
            verificationStatus,
            preparation,
            data;

        try {
            message = await loadMessage(messageFromCache, api);

            // Message data will be modified, don't refer to message.data anymore below!
            data = { ...message.data } as Message;

            encryptionPreferences = await getEncryptionPreferences(data.Sender.Address as string);
            userKeys = await getMessageKeys(message);
            const messageWithKeys = {
                ...message,
                publicKeys: encryptionPreferences.pinnedKeys,
                privateKeys: userKeys.privateKeys
            };

            // To verify the signature of the message, we just need to take into account pinned keys
            // API keys could always be forged by the server to verify the signature
            decryption = await decryptMessage(
                data,
                encryptionPreferences.pinnedKeys,
                userKeys.privateKeys,
                attachmentsCache
            );
            if (decryption.mimetype) {
                data = { ...data, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.Attachments || [];
            const allAttachments = [...data.Attachments, ...mimeAttachments];
            data = { ...data, Attachments: allAttachments, NumAttachments: allAttachments.length };
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

            await markAs([data as Element], labelID, MARK_AS_STATUS.READ);
            data = { ...data, Unread: 0 };

            preparation = isPlainText(data)
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
                data,
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
                showEmbeddedImages: preparation?.showEmbeddedImages,
                showRemoteImages: preparation?.showRemoteImages,
                embeddeds: preparation?.embeddeds,
                errors,
                initialized: true
            });
        }
    }, [localID]);
};

export const useTrustSigningPublicKey = (localID: string) => {
    const messageCache = useMessageCache();

    return useCallback(
        async (key: OpenPGPKey) => {
            const pinnedKeys = messageCache.get(localID)?.senderPinnedKeys || [];
            updateMessageCache(messageCache, localID, {
                verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                senderPinnedKeys: [key, ...pinnedKeys],
                senderVerified: true
            });
        },
        [localID]
    );
};

// if the attached public key signs the message, use the hook above
export const useTrustAttachedPublicKey = (localID: string) => {
    const messageCache = useMessageCache();

    return useCallback(
        async (key: OpenPGPKey) => {
            const pinnedKeys = messageCache.get(localID)?.senderPinnedKeys || [];
            updateMessageCache(messageCache, localID, {
                senderPinnedKeys: [key, ...pinnedKeys],
                senderVerified: true
            });
        },
        [localID]
    );
};

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const messageCache = useMessageCache();
    const api = useApi();

    return useCallback(async () => {
        const messageFromCache = messageCache.get(localID) as MessageExtended;
        const message = await loadMessage(messageFromCache, api);
        const address = message.data.Sender?.Address;
        if (!address) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences(address);
        updateMessageCache(messageCache, localID, {
            senderVerified: isContactSignatureVerified
        });
    }, [localID]);
};

export const useLoadRemoteImages = (localID: string) => {
    const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = messageCache.get(localID) as MessageExtended;

        transformRemote({ ...message, showRemoteImages: true }, mailSettings);

        updateMessageCache(messageCache, localID, {
            document: message.document,
            showRemoteImages: true
        });
    }, [localID]);
};

export const useLoadEmbeddedImages = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();
    const attachmentsCache = useAttachmentCache();

    return useCallback(async () => {
        const message = messageCache.get(localID) as MessageExtended;

        const { embeddeds } = await transformEmbedded(
            { ...message, showEmbeddedImages: true },
            attachmentsCache,
            api,
            mailSettings
        );

        updateMessageCache(messageCache, localID, {
            document: message.document,
            embeddeds,
            showEmbeddedImages: true
        });
    }, [localID]);
};

export const useReloadMessage = (localID: string) => {
    const messageCache = useMessageCache();
    const initializeMessage = useInitializeMessage(localID);

    return useCallback(async () => {
        messageCache.set(localID, { localID });
        await initializeMessage();
    }, [localID]);
};
