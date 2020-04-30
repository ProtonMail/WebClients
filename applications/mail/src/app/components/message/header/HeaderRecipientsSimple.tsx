import React from 'react';
import { c } from 'ttag';

import { Message } from '../../../models/message';
import { getRecipients } from '../../../helpers/message/messages';
import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

interface Props {
    message?: Message;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

const HeaderRecipientsSimple = ({ message, contacts, contactGroups }: Props) => {
    const recipients = getRecipients(message);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);

    return (
        <div className="flex flex-nowrap">
            <span className="flex-self-vcenter container-to pl0-5">{c('Label').t`To:`}</span>
            <span className="flex-self-vcenter mr0-5 ellipsis">
                {recipientsOrGroup.map((recipientOrGroup, index) => {
                    const label = getRecipientOrGroupLabel(recipientOrGroup, contacts);

                    return (
                        <span key={index} className="inline-flex mr0-5" title={label}>
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
