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
    isLoading?: boolean;
}

const HeaderRecipientsSimple = ({ message, contacts, contactGroups, isLoading }: Props) => {
    const recipients = getRecipients(message);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);

    return (
        <div className="flex flex-nowrap is-appearing-content">
            <span className="message-header-to container-to flex-self-vcenter pl0-5">
                {!isLoading && c('Label').t`To:`}
            </span>
            <span className="message-header-contact flex-self-vcenter mr0-5 ellipsis">
                {!isLoading &&
                    recipientsOrGroup.map((recipientOrGroup, index) => {
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
