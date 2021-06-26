import { useCallback } from 'react';
import { useApi, useMailSettings } from 'react-components';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { useGetMessageKeys } from './useGetMessageKeys';
import { updateImages } from '../../helpers/message/messageImages';

export const useLoadRemoteImages = (localID: string) => {
    const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = messageCache.get(localID) as MessageExtended;

        const { remoteImages } = transformRemote(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showRemoteImages: true }, undefined, undefined),
            },
            mailSettings
        );

        updateMessageCache(messageCache, localID, {
            document: message.document,
            messageImages: updateImages(message.messageImages, { showRemoteImages: true }, remoteImages, undefined),
        });
    }, [localID]);
};

export const useLoadEmbeddedImages = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const attachmentsCache = useAttachmentCache();
    const getMessageKeys = useGetMessageKeys();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = messageCache.get(localID) as MessageExtendedWithData;
        const messageKeys = await getMessageKeys(message.data);

        const { embeddedImages } = await transformEmbedded(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, undefined),
            },
            messageKeys,
            messageCache,
            attachmentsCache,
            api,
            mailSettings
        );

        updateMessageCache(messageCache, localID, {
            document: message.document,
            messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, embeddedImages),
        });
    }, [localID]);
};
