import { useCallback } from 'react';

import { useApi, useAuthentication } from '@proton/components';
import { WorkerDecryptionResult } from '@proton/crypto';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import useMailModel from 'proton-mail/hooks/useMailModel';

import {
    handleDispatchLoadFakeImagesProxy,
    handleDispatchLoadImagesProxy,
    handleDispatchLoadRemoteImagesDirect,
    updateImages,
} from '../../helpers/message/messageImages';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { loadEmbedded } from '../../logic/messages/images/messagesImagesActions';
import {
    LoadEmbeddedResults,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from '../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../logic/store';
import { useGetAttachment } from '../attachments/useAttachment';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useLoadRemoteImages = (localID: string) => {
    const dispatch = useAppDispatch();
    const api = useApi();
    const getMessage = useGetMessage();
    const mailSettings = useMailModel('MailSettings');
    const authentication = useAuthentication();

    return useCallback(async () => {
        const message = getMessage(localID) as MessageState;

        const handleLoadRemoteImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
            return handleDispatchLoadImagesProxy(localID, imagesToLoad, authentication, dispatch);
        };

        const handleLoadFakeImagesProxy = (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => {
            return handleDispatchLoadFakeImagesProxy(localID, imagesToLoad, api, dispatch, firstLoad);
        };

        const handleLoadRemoteImagesDirect = (imagesToLoad: MessageRemoteImage[]) => {
            return handleDispatchLoadRemoteImagesDirect(localID, imagesToLoad, dispatch);
        };

        transformRemote(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showRemoteImages: true }, undefined, undefined),
            },
            mailSettings,
            handleLoadRemoteImagesDirect,
            handleLoadRemoteImagesProxy,
            handleLoadFakeImagesProxy
        );
    }, [localID]);
};

export const useLoadEmbeddedImages = (localID: string) => {
    const dispatch = useAppDispatch();
    const api = useApi();
    const getAttachment = useGetAttachment();
    const getMessage = useGetMessage();
    const getMessageKeys = useGetMessageKeys();
    const mailSettings = useMailModel('MailSettings');

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
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
                    getAttachment,
                    onUpdateAttachment,
                    messageFlags: message.data.Flags,
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
            handleLoadEmbeddedImages
        );
    }, [localID]);
};
