import { useCallback } from 'react';

import { useApi, useMailSettings } from '@proton/components';
import { WorkerDecryptionResult } from '@proton/crypto';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { updateImages } from '../../helpers/message/messageImages';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import {
    loadEmbedded,
    loadFakeProxy,
    loadRemoteDirect,
    loadRemoteProxy,
} from '../../logic/messages/images/messagesImagesActions';
import {
    LoadEmbeddedResults,
    LoadRemoteResults,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from '../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../logic/store';
import { useGetAttachment } from '../useAttachment';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useLoadRemoteImages = (localID: string) => {
    const dispatch = useAppDispatch();
    const api = useApi();
    const getMessage = useGetMessage();
    const [mailSettings] = useMailSettings();

    return useCallback(async () => {
        const message = getMessage(localID) as MessageState;

        const handleLoadRemoteImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = imagesToLoad.map((image) => {
                return dispatch(loadRemoteProxy({ ID: localID, imageToLoad: image, api }));
            });
            return dispatchResult as any as Promise<LoadRemoteResults[]>;
        };

        const handleLoadFakeImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = imagesToLoad.map((image) => {
                return dispatch(loadFakeProxy({ ID: localID, imageToLoad: image, api }));
            });
            return dispatchResult as any as Promise<LoadRemoteResults[]>;
        };

        const handleLoadRemoteImagesDirect = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = imagesToLoad.map((image) => {
                return dispatch(loadRemoteDirect({ ID: localID, imageToLoad: image, api }));
            });
            return dispatchResult as any as Promise<LoadRemoteResults[]>;
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
    const [mailSettings] = useMailSettings();

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
