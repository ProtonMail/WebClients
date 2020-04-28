import { useCallback } from 'react';
import { useApi, useEventManager, useGetEncryptionPreferences, useMailSettings } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';
import { getMatchingKey } from 'pmcrypto/lib/key/utils';
import { VERIFICATION_STATUS } from '../constants';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { decryptMessage } from '../helpers/message/messageDecrypt';
import { loadMessage, markAsRead } from '../helpers/message/messageRead';
import { getVerificationStatus } from '../helpers/signatures';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { prepareMailDocument } from '../helpers/transforms/transforms';

import { Message, MessageExtended } from '../models/message';
import { useBase64Cache } from './useBase64Cache';
import { useMessageKeys } from './useMessageKeys';

export const useLoadMessage = (inputMessage: Message) => {
    const api = useApi();
    const messageCache = useMessageCache();

    return useCallback(async () => {
        const localID = inputMessage.ID || '';

        const messageFromCache = updateMessageCache(messageCache, localID, { data: inputMessage });

        // If the Body is already there, no need to send a request
        if (!messageFromCache.data?.Body) {
            const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
            // return { data: Message as Message };
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

        const message = await loadMessage(messageFromCache, api);
        const { apiKeys, pinnedKeys, isContactSignatureVerified } = await getEncryptionPreferences(
            message.data.Sender?.Address
        );
        const allSenderPublicKeys = [...pinnedKeys, ...apiKeys];

        const { publicKeys, privateKeys } = await getKeys(message);

        // To verify the signature of the message, we just need to take into account pinned keys
        // API keys could always be forged by the server to verify the signature
        const {
            decryptedBody,
            Attachments,
            verified,
            errors: verificationErrors,
            encryptedSubject,
            signature
        } = await decryptMessage(message.data, pinnedKeys, privateKeys, attachmentsCache);
        const signed = verified !== VERIFICATION_STATUS.NOT_SIGNED;
        const signingPublicKey = signed && signature ? await getMatchingKey(signature, allSenderPublicKeys) : undefined;
        const verificationStatus = getVerificationStatus(verified, pinnedKeys);

        await markAsRead(message, api, call);

        const { document, showRemoteImages, showEmbeddedImages, embeddeds } = await prepareMailDocument(
            { ...message, decryptedBody, publicKeys: pinnedKeys, privateKeys },
            base64Cache,
            attachmentsCache,
            api,
            mailSettings
        );

        const data = Attachments ? { ...message.data, Attachments } : message.data;

        updateMessageCache(messageCache, localID, {
            data,
            document,
            senderPinnedKeys: pinnedKeys,
            signingPublicKey,
            senderVerified: isContactSignatureVerified,
            publicKeys,
            privateKeys,
            decryptedBody,
            verificationStatus,
            verificationErrors,
            encryptedSubject,
            showEmbeddedImages,
            showRemoteImages,
            embeddeds,
            initialized: true
        });
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
