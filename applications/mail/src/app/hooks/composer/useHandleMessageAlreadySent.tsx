import { c } from 'ttag';
import { useHandler, useNotifications } from '@proton/components';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useCreateDraft } from '../message/useSaveDraft';
import { useMessageCache } from '../../containers/MessageProvider';

interface UseHandleMessageAlreadySentParameters {
    modelMessage: MessageExtended;
    onClose: () => void;
}

export const useHandleMessageAlreadySent = ({ modelMessage, onClose }: UseHandleMessageAlreadySentParameters) => {
    const { createNotification } = useNotifications();
    const createDraft = useCreateDraft();
    const messageCache = useMessageCache();

    const duplicateDraft = useHandler(() => {
        const messageFromCache = messageCache.get(modelMessage.localID) as MessageExtendedWithData;

        void createDraft({
            ...messageFromCache,
            localID: '',
            data: {
                ...messageFromCache.data,
                ID: '',
            },
        });

        // remove the old draft from message cache (which will close the composer)
        messageCache.delete(modelMessage.localID);
    });

    const handleMessageAlreadySent = () => {
        duplicateDraft();
        createNotification({
            text: c('Error').t`Message already sent. Saving your email as a draft`,
            type: 'error',
        });
        onClose();
    };

    return handleMessageAlreadySent;
};
