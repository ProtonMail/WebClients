import { c } from 'ttag';

import { useHandler, useNotifications } from '@proton/components';
import type { MessageState, MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { deleteDraft } from '../../store/messages/draft/messagesDraftActions';
import { useGetMessage } from '../message/useMessage';
import { useCreateDraft } from '../message/useSaveDraft';

interface UseHandleMessageAlreadySentParameters {
    modelMessage: MessageState;
    onClose: () => void;
}

export const useHandleMessageAlreadySent = ({ modelMessage, onClose }: UseHandleMessageAlreadySentParameters) => {
    const { createNotification } = useNotifications();
    const createDraft = useCreateDraft();
    const getMessage = useGetMessage();
    const dispatch = useMailDispatch();

    const duplicateDraft = useHandler(() => {
        const messageFromCache = getMessage(modelMessage.localID) as MessageStateWithData;

        void createDraft({
            ...messageFromCache,
            localID: '',
            data: {
                ...messageFromCache.data,
                ID: '',
            },
        });

        // remove the old draft from message cache (which will close the composer)
        dispatch(deleteDraft(modelMessage.localID));
    });

    const handleMessageAlreadySent = () => {
        duplicateDraft();
        createNotification({
            text: c('Error').t`This message has already been sent. A new draft has been saved.`,
            type: 'error',
        });
        onClose();
    };

    return handleMessageAlreadySent;
};
