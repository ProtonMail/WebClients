import type { RefObject } from 'react';
import { createPortal } from 'react-dom';

import { MESSAGE_IFRAME_PRINT_FOOTER_ID, MESSAGE_IFRAME_PRINT_HEADER_ID } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { hasAttachments } from '@proton/shared/lib/mail/messages';

import MessagePrintFooter from 'proton-mail/components/message/MessagePrintFooter';
import MessagePrintHeader from 'proton-mail/components/message/MessagePrintHeader';

interface Props {
    iframeRef: RefObject<HTMLIFrameElement>;
    isPrint: boolean;
    message: MessageState;
    labelID: string;
}

const MessageBodyPrint = ({ iframeRef, isPrint, message, labelID }: Props) => {
    const hasAttachment = hasAttachments(message.data);
    const iframePrintHeaderDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_HEADER_ID);
    const iframePrintFooterDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_FOOTER_ID);

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
