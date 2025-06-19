import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import './MessageHeadersModal.scss';

interface Props extends ModalProps {
    message?: MessageWithOptionalBody;
}

const MessageHeadersModal = ({ message, ...rest }: Props) => {
    const { onClose } = rest;
    const content = `${message?.Header}\n\r${message?.Body}`;

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, 'pgp.txt');
    };

    return (
        <ModalTwo className="message-headers-modal" size="large" as={Form} onSubmit={handleDownload} {...rest}>
            <ModalTwoHeader title={c('Info').t`Message headers`} />
            <ModalTwoContent>
                <pre className="text-break">{content}</pre>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit">{c('Action').t`Download`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MessageHeadersModal;
