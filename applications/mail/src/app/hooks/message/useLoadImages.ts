import { useCallback } from 'react';

import { useApi, useAuthentication } from '@proton/components';
import type { WorkerDecryptionResult } from '@proton/crypto';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import {
    handleDispatchLoadFakeImagesProxy,
    handleDispatchLoadImagesProxy,
    handleDispatchLoadRemoteImagesDirect,
    updateImages,
} from '../../helpers/message/messageImages';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { updateAttachment } from '../../store/attachments/attachmentsActions';
import { loadEmbedded } from '../../store/messages/images/messagesImagesActions';
import type {
    LoadEmbeddedResults,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from '../../store/messages/messagesTypes';
import { useGetAttachment } from '../attachments/useAttachment';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useLoadRemoteImages = (localID: string) => {
    const dispatch = useMailDispatch();
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
    const dispatch = useMailDispatch();
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

        const handleLoadEmbeddedImages = (attachments: Attachment[], isDraft?: boolean) => {
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
                    isDraft,
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
