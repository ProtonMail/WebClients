import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { inboxDesktopHasPrintDialogOption, inboxDesktopPrintDialog } from '@proton/shared/lib/desktop/printing/print';
import { useFlag } from '@proton/unleash/useFlag';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import MessageBody from '../MessageBody';

import './MessagePrint.scss';

interface Props extends ModalProps {
    labelID: string;
    message: MessageStateWithData;
}

const MessagePrintModal = ({ labelID, message, ...rest }: Props) => {
    const iframeRef = useRef<HTMLIFrameElement | null>();
    const { onClose } = rest;
    const isInboxDesktopPrintDialoglDisabled = useFlag('InboxDesktopSaveAsPdfPrintDialogDisabled');

    const handlePrint = async () => {
        if (!isInboxDesktopPrintDialoglDisabled && inboxDesktopHasPrintDialogOption()) {
            const iframe = iframeRef.current;
            if (!iframe?.contentDocument) {
                return;
            }

            await inboxDesktopPrintDialog(iframe.contentDocument);
        } else {
            iframeRef.current?.contentWindow?.print();
        }
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
