import { RefObject, useEffect, useRef } from 'react';

import { c } from 'ttag';

import {
    Button,
    Form,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import MessageBody from '../MessageBody';

import './MessagePrint.scss';

interface Props extends ModalProps {
    labelID: string;
    message: MessageStateWithData;
}

const MessagePrintModal = ({ labelID, message, ...rest }: Props) => {
    const iframeRef = useRef<HTMLIFrameElement | null>();
    const { onClose } = rest;

    const handlePrint = () => {
        iframeRef.current?.contentWindow?.print();
    };

    useEffect(() => {
        document.body.classList.add('is-printed-version');
    }, []);

    const handleClose = () => {
        document.body.classList.remove('is-printed-version');
        onClose?.();
    };

    const handleIframeReady = (iframe: RefObject<HTMLIFrameElement>) => {
        iframeRef.current = iframe.current;
    };

    return (
        <ModalTwo className="print-modal" as={Form} onSubmit={handlePrint} {...rest} onClose={handleClose}>
            <ModalTwoHeader title={c('Info').t`Print email`} />
            <ModalTwoContent>
                <MailboxContainerContextProvider containerRef={null} elementID={undefined} isResizing={false}>
                    <MessageBody
                        messageLoaded
                        bodyLoaded
                        sourceMode={false}
                        message={message}
                        labelID={labelID}
                        originalMessageMode={false}
                        forceBlockquote
                        isPrint
                        onIframeReady={handleIframeReady}
                    />
                </MailboxContainerContextProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit">{c('Action').t`Print`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MessagePrintModal;
