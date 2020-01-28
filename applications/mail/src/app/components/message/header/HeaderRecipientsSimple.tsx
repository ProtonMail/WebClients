import React from 'react';
import { c } from 'ttag';
import { Message } from '../../../models/message';
import { getRecipients } from '../../../helpers/message/messages';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';
import { ContactGroup, ContactEmail } from '../../../models/contact';

interface Props {
    message?: Message;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

const HeaderRecipientsSimple = ({ message = {}, contacts, contactGroups }: Props) => {
    const recipients = getRecipients(message);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);

    return (
        <div className="flex">
            <span className="opacity-50 flex-self-vcenter container-to">{c('Label').t`To:`}</span>
            <span className="flex-self-vcenter mr1">
                {recipientsOrGroup.map((recipientOrGroup, index) => {
                    const label = getRecipientOrGroupLabel(recipientOrGroup, contacts);
                    return (
                        <span key={index} className="mr0-5" title={label}>
                            {label}
                            {index < recipientsOrGroup.length - 1 && ','}
                        </span>
                    );
                })}
            </span>
        </div>
    );
};

export default HeaderRecipientsSimple;
