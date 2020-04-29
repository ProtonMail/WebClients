import { useCallback } from 'react';
import { useApi, useEventManager, useGetEncryptionPreferences, useMailSettings } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';
import { getMatchingKey } from 'pmcrypto/lib/key/utils';

import { VERIFICATION_STATUS } from '../constants';
import { MessageExtended, Message, MessageErrors } from '../models/message';
import { loadMessage, markAsRead } from '../helpers/message/messageRead';
import { useMessageKeys } from './useMessageKeys';
import { decryptMessage } from '../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { getVerificationStatus } from '../helpers/signatures';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { prepareMailDocument } from '../helpers/transforms/transforms';
import { isApiError } from '../helpers/errors';
import { useBase64Cache } from './useBase64Cache';

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

export const useMarkAsRead = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();

    return useCallback(async () => {
        const messageFromCache = messageCache.get(localID) as MessageExtended;
        const message = await markAsRead(messageFromCache, api, call);
        updateMessageCache(messageCache, localID, message);
    }, [localID]);
};

export const useInitializeMessage = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const getKeys = useMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const { call } = useEventManager();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(async () => {
        // Cache entry will be (at least) initialized by the queue system
        const messageFromCache = messageCache.get(localID) as MessageExtended;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromCache || !messageFromCache.data) {
            messageFromCache.data = { ID: localID };
        }

        updateMessageCache(messageCache, localID, { initialized: false });

        const errors: MessageErrors = {};

        let message,
            encryptionPreferences,
            userKeys,
            decryption,
            signingPublicKey,
            verificationStatus,
            preparation,
            data;

        try {
            message = await loadMessage(messageFromCache, api);
            // const { apiKeys, pinnedKeys, isContactSignatureVerified } = await getEncryptionPreferences(
            encryptionPreferences = await getEncryptionPreferences(message.data.Sender?.Address);

            const allSenderPublicKeys = [...encryptionPreferences.pinnedKeys, ...encryptionPreferences.apiKeys];

            userKeys = await getKeys(message);

            // To verify the signature of the message, we just need to take into account pinned keys
            // API keys could always be forged by the server to verify the signature
            decryption = await decryptMessage(
                message.data,
                encryptionPreferences.pinnedKeys,
                userKeys.privateKeys,
                attachmentsCache
            );

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);
            }

            const signed = decryption.verified !== VERIFICATION_STATUS.NOT_SIGNED;
            signingPublicKey =
                signed && decryption.signature
                    ? await getMatchingKey(decryption.signature, allSenderPublicKeys)
                    : undefined;
            verificationStatus = getVerificationStatus(decryption.verified, encryptionPreferences.pinnedKeys);

            await markAsRead(message, api, call);

            preparation = await prepareMailDocument(
                {
                    ...message,
                    decryptedBody: decryption.decryptedBody,
                    publicKeys: encryptionPreferences.pinnedKeys,
                    privateKeys: userKeys.privateKeys
                },
                base64Cache,
                attachmentsCache,
                api,
                mailSettings
            );

            data = decryption.Attachments ? { ...message.data, Attachments: decryption.Attachments } : message.data;
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
                senderPinnedKeys: encryptionPreferences?.pinnedKeys,
                signingPublicKey,
                senderVerified: encryptionPreferences?.isContactSignatureVerified,
                publicKeys: userKeys?.publicKeys,
                privateKeys: userKeys?.privateKeys,
                decryptedBody: decryption?.decryptedBody,
                verificationStatus,
                verificationErrors: decryption?.verificationErrors,
                encryptedSubject: decryption?.encryptedSubject,
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

    return useCallback(async () => {
        updateMessageCache(messageCache, localID, {
            verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID
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
