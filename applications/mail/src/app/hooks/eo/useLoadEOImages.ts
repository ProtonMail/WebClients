import { useCallback } from 'react';

import { useApi } from '@proton/components';
import type { MessageRemoteImage, MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { updateImages } from '../../helpers/message/messageImages';
import { transformEmbedded } from '../../helpers/transforms/transformEmbedded';
import { transformRemote } from '../../helpers/transforms/transformRemote';
import { EOLoadEmbedded, EOLoadRemote } from '../../store/eo/eoActions';
import type { EOLoadEmbeddedResults, EOLoadRemoteResults } from '../../store/eo/eoType';
import { useGetEODecryptedToken, useGetEOMessageState, useGetEOPassword } from './useLoadEOMessage';

export const useLoadEORemoteImages = (mailSettings: MailSettings) => {
    const dispatch = useMailDispatch();
    const getMessage = useGetEOMessageState();

    return useCallback(async () => {
        const message = getMessage() as MessageState;

        const handleLoadEORemoteImages = (imagesToLoad: MessageRemoteImage[]) => {
            const dispatchResult = dispatch(EOLoadRemote({ imagesToLoad }));
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
    const dispatch = useMailDispatch();
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
            EO_DEFAULT_MAILSETTINGS,
            handleLoadEOEmbeddedImages
        );
    }, []);
};
