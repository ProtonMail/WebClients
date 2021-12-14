import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { MessageRemoteImage, MessageState } from 'proton-mail/src/app/logic/messages/messagesTypes';
import { useApi } from '@proton/components';
import { transformRemote } from 'proton-mail/src/app/helpers/transforms/transformRemote';
import { updateImages } from 'proton-mail/src/app/helpers/message/messageImages';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { transformEmbedded } from 'proton-mail/src/app/helpers/transforms/transformEmbedded';
import { EOLoadEmbedded, EOLoadRemote } from '../logic/eo/eoActions';
import { EOLoadEmbeddedResults, EOLoadRemoteResults } from '../logic/eo/eoType';
import { useGetEODecryptedToken, useGetMessageState, useGetPassword } from './useOutsideMessage';

export const useLoadEORemoteImages = () => {
    const dispatch = useDispatch();
    const api = useApi();
    const getMessage = useGetMessageState();

    return useCallback(async () => {
        const message = getMessage() as MessageState;

        const handleLoadEORemoteImages = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = dispatch(EOLoadRemote({ imagesToLoad, api }));
            return dispatchResult as any as Promise<EOLoadRemoteResults[]>;
        };

        transformRemote(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showRemoteImages: true }, undefined, undefined),
            },
            undefined,
            (imagesToLoad) => {
                console.log(imagesToLoad);
            },
            (imagesToLoad) => {
                console.log(imagesToLoad);
            },
            handleLoadEORemoteImages
        );
    }, []);
};

export const useLoadEOEmbeddedImages = (id: string) => {
    const dispatch = useDispatch();
    const api = useApi();
    const getMessage = useGetMessageState();
    const getDecryptedToken = useGetEODecryptedToken();
    const getPassword = useGetPassword();

    return useCallback(async () => {
        const message = getMessage() as MessageState;
        const decryptedToken = getDecryptedToken();
        const password = getPassword();

        const handleLoadEOEmbeddedImages = (attachments: Attachment[]) => {
            const dispatchResult = dispatch(
                EOLoadEmbedded({
                    attachments,
                    api,
                    messageVerification: message.verification,
                    password,
                    id,
                    decryptedToken,
                })
            );
            return dispatchResult as any as Promise<EOLoadEmbeddedResults>;
        };

        await transformEmbedded(
            {
                ...message,
                messageImages: updateImages(message.messageImages, { showEmbeddedImages: true }, undefined, undefined),
            },
            undefined,
            handleLoadEOEmbeddedImages
        );
    }, []);
};
