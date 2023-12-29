import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorButton, ModalProps, Prompt, useApi, useEventManager, useNotifications } from '@proton/components';
import { deleteMessages } from '@proton/shared/lib/api/messages';

import {
    getDeleteTitle,
    getModalText,
    getNotificationText,
} from '../../../hooks/actions/delete/usePermanentDeleteSelection';
import { MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';

interface Props extends ModalProps {
    message: MessageWithOptionalBody;
}

const MessagePermanentDeleteModal = ({ message, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const { onClose } = rest;

    const handleDelete = async () => {
        onClose?.();
        await api(deleteMessages([message.ID]));
        await call();
        createNotification({ text: getNotificationText(false, false, 1) });
    };

    return (
        <Prompt
            title={getDeleteTitle(false, false, 1)}
            buttons={[
                <ErrorButton onClick={handleDelete}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText(false, false, 1)}
        </Prompt>
    );
};

export default MessagePermanentDeleteModal;
