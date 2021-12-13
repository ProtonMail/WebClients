import { hasAttachments } from '@proton/shared/lib/mail/messages';
import { RefObject, useEffect, useRef } from 'react';
import { FormModal } from '@proton/components';
import { c } from 'ttag';
import MessageBody from '../MessageBody';
import MessageFooter from '../MessageFooter';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';

import './MessagePrint.scss';

interface Props {
    labelID: string;
    message: MessageStateWithData;
    onClose?: () => void;
}

const MessagePrintModal = ({ labelID, message, onClose, ...rest }: Props) => {
    const iframeRef = useRef<HTMLIFrameElement | null>();

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
        <FormModal
            title={c('Info').t`Print email`}
            submit={c('Action').t`Print`}
            onEnter={handlePrint}
            onSubmit={handlePrint}
            onClose={handleClose}
            className="modal--wider"
            {...rest}
        >
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
            {hasAttachments(message.data) ? <MessageFooter message={message} showActions={false} /> : null}
        </FormModal>
    );
};

export default MessagePrintModal;
