import { c } from 'ttag';

import {
    AlertModal,
    Button,
    ErrorButton,
    ModalProps,
    useApi,
    useEventManager,
    useNotifications,
} from '@proton/components';
import { deleteMessages } from '@proton/shared/lib/api/messages';

import { getDeleteTitle, getModalText, getNotificationText } from '../../../hooks/usePermanentDelete';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props extends ModalProps {
    message: MessageState;
}

const MessagePermanentDeleteModal = ({ message, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const { onClose } = rest;

    const handleDelete = async () => {
        const messageID = message.data?.ID;
        if (!messageID) {
            return;
        }
        onClose?.();
        await api(deleteMessages([messageID]));
        await call();
        createNotification({ text: getNotificationText(false, false, 1) });
    };

    return (
        <AlertModal
            title={getDeleteTitle(false, false, 1)}
            buttons={[
                <ErrorButton onClick={handleDelete}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText(false, false, 1)}
        </AlertModal>
    );
};

export default MessagePermanentDeleteModal;
