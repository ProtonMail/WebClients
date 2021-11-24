import { getSender, hasAttachments } from '@proton/shared/lib/mail/messages';
import { useEffect } from 'react';
import { FormModal } from '@proton/components';
import { c } from 'ttag';
import { Recipient } from '@proton/shared/lib/interfaces';
import MessageBody from '../MessageBody';
import RecipientsDetails from '../recipients/RecipientsDetails';
import ItemDate from '../../list/ItemDate';
import MessageFooter from '../MessageFooter';
import RecipientType from '../recipients/RecipientType';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import './MessagePrint.scss';

interface Props {
    labelID: string;
    message: MessageStateWithData;
    onClose?: () => void;
}

const MessagePrintModal = ({ labelID, message, onClose, ...rest }: Props) => {
    const { getRecipientLabel } = useRecipientLabel();
    const sender = getSender(message.data);

    const handlePrint = () => window.print();

    useEffect(() => {
        document.body.classList.add('is-printed-version');
    }, []);

    const handleClose = () => {
        document.body.classList.remove('is-printed-version');
        onClose?.();
    };

    return (
        <FormModal
            title={c('Info').t`Print email`}
            submit={c('Action').t`Print`}
            onEnter={handlePrint}
            onSubmit={handlePrint}
            onClose={handleClose}
            className="modal--wider "
            {...rest}
        >
            <div className="message-print">
                <div className="message-print-header pb1 mb1">
                    <h2 className="message-print-subject text-bold pb0-5 mb0-5">{message.data?.Subject}</h2>
                    <RecipientType label={c('Label').t`From:`}>
                        {getRecipientLabel(sender as Recipient, true)}{' '}
                        <span className="color-weak">&lt;{sender?.Address}&gt;</span>
                    </RecipientType>
                    <RecipientsDetails message={message} isLoading={false} />
                    <RecipientType label={c('Label').t`Date:`}>
                        <ItemDate element={message.data} labelID={labelID} mode="full" />
                    </RecipientType>
                </div>
                <MessageBody
                    messageLoaded
                    bodyLoaded
                    sourceMode={false}
                    message={message}
                    originalMessageMode={false}
                    forceBlockquote
                />
                {hasAttachments(message.data) ? <MessageFooter message={message} showActions={false} /> : null}
            </div>
        </FormModal>
    );
};

export default MessagePrintModal;
