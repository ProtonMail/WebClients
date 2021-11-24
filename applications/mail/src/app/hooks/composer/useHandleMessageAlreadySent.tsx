import { c } from 'ttag';
import { useHandler, useNotifications } from '@proton/components';
import { useDispatch } from 'react-redux';
import { useCreateDraft } from '../message/useSaveDraft';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import { deleteDraft } from '../../logic/messages/draft/messagesDraftActions';

interface UseHandleMessageAlreadySentParameters {
    modelMessage: MessageState;
    onClose: () => void;
}

export const useHandleMessageAlreadySent = ({ modelMessage, onClose }: UseHandleMessageAlreadySentParameters) => {
    const { createNotification } = useNotifications();
    const createDraft = useCreateDraft();
    const getMessage = useGetMessage();
    const dispatch = useDispatch();

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
