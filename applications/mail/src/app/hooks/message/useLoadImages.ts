import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useApi, useMailSettings } from '@proton/components';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { useGetMessageKeys } from './useGetMessageKeys';
import { updateImages } from '../../helpers/message/messageImages';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';
import { loadRemoteProxy, loadRemoteDirect, loadEmbedded } from '../../logic/messages/messagesActions';
import {
    MessageState,
    MessageRemoteImage,
    LoadRemoteProxyResults,
    LoadEmbeddedResults,
    MessageStateWithData,
} from '../../logic/messages/messagesTypes';
import { useGetMessage } from './useMessage';

export const useLoadRemoteImages = (localID: string) => {
    const dispatch = useDispatch();
    const api = useApi();
    const getMessage = useGetMessage();
    // const messageCache = useMessageCache();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = getMessage(localID) as MessageState;

        const handleLoadRemoteImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = dispatch(loadRemoteProxy({ ID: localID, imagesToLoad, api }));
            return dispatchResult as any as Promise<LoadRemoteProxyResults[]>;
        };

        const handleLoadRemoteImagesDirect = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = dispatch(loadRemoteDirect({ ID: localID, imagesToLoad, api }));
            return dispatchResult as any as Promise<[MessageRemoteImage, unknown][]>;
        };

        transformRemote(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showRemoteImages: true }, undefined, undefined),
            },
            mailSettings,
            handleLoadRemoteImagesProxy,
            handleLoadRemoteImagesDirect
        );

        // updateMessageCache(messageCache, localID, {
        //     document: message.document,
        //     messageImages: updateImages(message.messageImages, { showRemoteImages: true }, remoteImages, undefined),
        // });
    }, [localID]);
};

export const useLoadEmbeddedImages = (localID: string) => {
    const dispatch = useDispatch();
    const api = useApi();
    const getAttachment = useGetAttachment();
    const getMessage = useGetMessage();
    // const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();
    const [mailSettings] = useMailSettings();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(async () => {
        const message = getMessage(localID) as MessageStateWithData;
        const messageKeys = await getMessageKeys(message.data);

        const handleLoadEmbeddedImages = (attachments: Attachment[]) => {
            const dispatchResult = dispatch(
                loadEmbedded({
                    ID: localID,
                    attachments,
                    api,
                    messageKeys,
                    messageVerification: message.verification,
                    attachmentsCache,
                })
            );
            return dispatchResult as any as Promise<LoadEmbeddedResults>;
        };

        await transformEmbedded(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, undefined),
            },
            mailSettings,
            handleLoadEmbeddedImages,
            getAttachment,
            onUpdateAttachment
        );

        // updateMessageCache(messageCache, localID, {
        //     document: message.document,
        //     messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, embeddedImages),
        // });
    }, [localID]);
};
