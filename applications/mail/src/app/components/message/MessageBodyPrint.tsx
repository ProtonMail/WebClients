import type { RefObject } from 'react';
import { createPortal } from 'react-dom';

import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MESSAGE_IFRAME_PRINT_FOOTER_ID, MESSAGE_IFRAME_PRINT_HEADER_ID } from '@proton/mail-renderer/constants';
import { getIframeDocument } from '@proton/mail-renderer/helpers/getIframeDocument';
import { getIframeSlot } from '@proton/mail-renderer/helpers/iframeSlots';
import { hasAttachments } from '@proton/shared/lib/mail/messages';

import MessagePrintFooter from './MessagePrintFooter';
import MessagePrintHeader from './MessagePrintHeader';

interface Props {
    iframeRef: RefObject<HTMLIFrameElement | null>;
    isPrint: boolean;
    message: MessageState;
    labelID: string;
}

const MessageBodyPrint = ({ iframeRef, isPrint, message, labelID }: Props) => {
    const hasAttachment = hasAttachments(message.data);
    const iframeDocument = getIframeDocument(iframeRef.current);
    const iframePrintHeaderDiv = getIframeSlot(iframeDocument, MESSAGE_IFRAME_PRINT_HEADER_ID);
    const iframePrintFooterDiv = getIframeSlot(iframeDocument, MESSAGE_IFRAME_PRINT_FOOTER_ID);

    return (
        <>
            {isPrint &&
                iframePrintHeaderDiv &&
                createPortal(<MessagePrintHeader message={message} labelID={labelID} />, iframePrintHeaderDiv)}
            {hasAttachment &&
                isPrint &&
                iframePrintFooterDiv &&
                createPortal(<MessagePrintFooter message={message} />, iframePrintFooterDiv)}
        </>
    );
};

export default MessageBodyPrint;
