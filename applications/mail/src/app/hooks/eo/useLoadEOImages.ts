import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { updateImages } from '../../helpers/message/messageImages';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { EOLoadEmbedded, EOLoadRemote } from '../../logic/eo/eoActions';
import { EOLoadEmbeddedResults, EOLoadRemoteResults } from '../../logic/eo/eoType';
import { MessageRemoteImage, MessageState } from '../../logic/messages/messagesTypes';
import { useGetEODecryptedToken, useGetEOMessageState, useGetEOPassword } from './useLoadEOMessage';

export const useLoadEORemoteImages = (mailSettings: MailSettings) => {
    const dispatch = useDispatch();
    const api = useApi();
    const getMessage = useGetEOMessageState();

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
            mailSettings,
            handleLoadEORemoteImages
        );
    }, []);
};

export const useLoadEOEmbeddedImages = (id: string) => {
    const dispatch = useDispatch();
    const api = useApi();
    const getMessage = useGetEOMessageState();
    const getDecryptedToken = useGetEODecryptedToken();
    const getPassword = useGetEOPassword();

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
