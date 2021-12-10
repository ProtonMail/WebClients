import { c } from 'ttag';
import { getSender } from '@proton/shared/lib/mail/messages';
import { Recipient } from '@proton/shared/lib/interfaces';

import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import { MessageState } from '../../logic/messages/messagesTypes';
import ItemDate from '../list/ItemDate';
import RecipientsDetails from './recipients/RecipientsDetails';
import RecipientType from './recipients/RecipientType';

interface Props {
    message: MessageState;
    labelID: string;
}

const MessagePrintHeader = ({ message, labelID }: Props) => {
    const { getRecipientLabel } = useRecipientLabel();
    const sender = getSender(message.data);

    return (
        <div className="proton-print">
            <div className="message-print-header">
                <h2 className="message-print-subject">{message.data?.Subject}</h2>
                <RecipientType label={c('Label').t`From:`}>
                    {getRecipientLabel(sender as Recipient, true)}{' '}
                    <span className="color-weak">&lt;{sender?.Address}&gt;</span>
                </RecipientType>
                <RecipientsDetails message={message} isLoading={false} />
                <RecipientType label={c('Label').t`Date:`}>
                    <ItemDate element={message.data} labelID={labelID} mode="full" />
                </RecipientType>
            </div>
        </div>
    );
};

export default MessagePrintHeader;
