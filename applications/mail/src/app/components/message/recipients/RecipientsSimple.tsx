import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients } from 'proton-shared/lib/mail/messages';
import React from 'react';
import { c } from 'ttag';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { recipientsToRecipientOrGroup, getRecipientOrGroupLabel } from '../../../helpers/addresses';

interface Props {
    message?: Message;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    isLoading?: boolean;
}

const RecipientsSimple = ({ message, contacts, contactGroups, isLoading }: Props) => {
    const recipients = getRecipients(message);
    const recipientsOrGroup = recipientsToRecipientOrGroup(recipients, contactGroups);

    return (
        <div className="flex flex-nowrap is-appearing-content">
            <span className="message-header-to container-to pl0-5">{!isLoading && c('Label').t`To:`}</span>
            <span className="message-header-contact ellipsis">
                {!isLoading && (
                    <>
                        {recipients.length
                            ? recipientsOrGroup.map((recipientOrGroup, index) => {
                                  const label = getRecipientOrGroupLabel(recipientOrGroup, contacts);

                                  return (
                                      <span
                                          key={index} // eslint-disable-line react/no-array-index-key
                                          title={label}
                                      >
                                          {label}
                                          {index < recipientsOrGroup.length - 1 && ', '}
                                      </span>
                                  );
                              })
                            : c('Label').t`Undisclosed Recipients`}
                    </>
                )}
            </span>
        </div>
    );
};

export default RecipientsSimple;
