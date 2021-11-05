import { useCallback } from 'react';
import { useApi, useMailSettings } from '@proton/components';
import { useDispatch } from 'react-redux';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { useGetMessageKeys } from './useGetMessageKeys';
import { updateImages } from '../../helpers/message/messageImages';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';

export const useLoadRemoteImages = (localID: string) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = messageCache.get(localID) as MessageExtended;

        const { remoteImages } = transformRemote(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showRemoteImages: true }, undefined, undefined),
            },
            mailSettings,
            api,
            messageCache
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
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const getMessageKeys = useGetMessageKeys();
    const [mailSettings] = useMailSettings();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

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
            getAttachment,
            onUpdateAttachment,
            api,
            mailSettings
        );

        updateMessageCache(messageCache, localID, {
            document: message.document,
            messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, embeddedImages),
        });
    }, [localID]);
};
