import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { deleteMessages } from '@proton/shared/lib/api/messages';

import {
    getDeleteTitle,
    getModalText,
    getNotificationText,
} from '../../../hooks/actions/delete/usePermanentDeleteSelection';

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
                <Button color="danger" onClick={handleDelete}>{c('Action').t`Delete`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText(false, false, 1)}
        </Prompt>
    );
};

export default MessagePermanentDeleteModal;
