import { c } from 'ttag';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { getSender } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import ItemDate from '../list/ItemDate';
import RecipientType from './recipients/RecipientType';
import RecipientsDetails from './recipients/RecipientsDetails';

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
                <div className="message-print-recipient-container">
                    <RecipientType label={c('Label').t`From`}>
                        {getRecipientLabel(sender as Recipient, true)}{' '}
                        <span className="color-weak">&lt;{sender?.Address}&gt;</span>
                    </RecipientType>
                    <RecipientsDetails
                        message={message}
                        isLoading={false}
                        showDropdown={false}
                        isPrintModal
                        onContactDetails={noop}
                        onContactEdit={noop}
                    />
                    <RecipientType label={c('Label').t`Date`}>
                        <ItemDate element={message.data} labelID={labelID} mode="full" />
                    </RecipientType>
                </div>
            </div>
        </div>
    );
};

export default MessagePrintHeader;
