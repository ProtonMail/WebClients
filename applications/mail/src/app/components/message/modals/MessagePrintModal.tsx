import React, { useEffect } from 'react';
import { FormModal, useContactEmails, useContactGroups } from 'react-components';
import { c } from 'ttag';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import { MessageExtended } from '../../../models/message';
import MessageBody from '../MessageBody';
import HeaderRecipientsDetails from '../header/HeaderRecipientsDetails';
import ItemDate from '../../list/ItemDate';
import MessageFooter from '../MessageFooter';
import { hasAttachments, getSender } from '../../../helpers/message/messages';
import { getRecipientLabel } from '../../../helpers/addresses';
import RecipientItem from '../header/HeaderRecipientItem';

import './MessagePrint.scss';

interface Props {
    message: MessageExtended;
    onClose?: () => void;
}

const MessagePrintModal = ({ message, onClose, ...rest }: Props) => {
    const [contacts] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups = []] = useContactGroups();
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
            className="pm-modal--wider "
            {...rest}
        >
            <div className="message-print">
                <div className="message-print-header pb1 mb1">
                    <h2 className="message-print-subject bold pb0-5 mb0-5">{message.data?.Subject}</h2>
                    <RecipientItem label={c('Label').t`From:`}>
                        {getRecipientLabel(sender)} <span className="opacity-50">&lt;{sender.Address}&gt;</span>
                    </RecipientItem>
                    <HeaderRecipientsDetails message={message.data} contacts={contacts} contactGroups={contactGroups} />
                    <RecipientItem label={c('Label').t`Date:`}>
                        <ItemDate element={message.data} mode="full" />
                    </RecipientItem>
                </div>
                <MessageBody message={message} showBlockquote={false} />
                {hasAttachments(message.data) ? <MessageFooter message={message} showActions={false} /> : null}
            </div>
        </FormModal>
    );
};

export default MessagePrintModal;
