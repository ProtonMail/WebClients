import { useCallback } from 'react';
import { useApi, useEventManager, useMailSettings } from 'react-components';

import { MessageExtended, Message } from '../models/message';
import { loadMessage, markAsRead } from '../helpers/message/messageRead';
import { useMessageKeys } from './useMessageKeys';
import { decryptMessage } from '../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { useBase64Cache } from './useBase64Cache';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { useMessageCache, updateMessageCache } from '../containers/MessageProvider';
import { getMessage } from 'proton-shared/lib/api/messages';
import { prepareMailDocument } from '../helpers/transforms/transforms';
import { getContent } from '../helpers/message/messageContent';

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

export const useInitializeMessage = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const getKeys = useMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const { call } = useEventManager();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        // Cache entry will be (at least) initialized by the queue system
        const messageFromCache = messageCache.get(localID) as MessageExtended;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromCache || !messageFromCache.data) {
            messageFromCache.data = { ID: localID };
        }

        updateMessageCache(messageCache, localID, { initialized: false });

        const message = await loadMessage(messageFromCache, api);

        const { publicKeys, privateKeys } = await getKeys(message);

        const { decryptedBody, Attachments, verified, encryptedSubject } = await decryptMessage(
            message.data,
            publicKeys,
            privateKeys,
            attachmentsCache
        );

        await markAsRead(message, api, call);

        const { document, showRemoteImages, showEmbeddedImages, embeddeds } = await prepareMailDocument(
            { ...message, decryptedBody, publicKeys, privateKeys },
            base64Cache,
            attachmentsCache,
            api,
            mailSettings
        );

        const data = Attachments ? { ...message.data, Attachments } : message.data;

        console.log('init', getContent({ document }), decryptedBody);

        updateMessageCache(messageCache, localID, {
            data,
            document,
            publicKeys,
            privateKeys,
            decryptedBody,
            verified,
            encryptedSubject,
            showEmbeddedImages,
            showRemoteImages,
            embeddeds,
            initialized: true
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
