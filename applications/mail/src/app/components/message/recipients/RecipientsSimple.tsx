import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getRecipients } from 'proton-shared/lib/mail/messages';
import React from 'react';
import { c } from 'ttag';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    message?: Message;
    isLoading?: boolean;
}

const RecipientsSimple = ({ message, isLoading }: Props) => {
    const { getRecipientsOrGroups, getRecipientOrGroupLabel } = useRecipientLabel();
    const recipients = getRecipients(message);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);

    return (
        <div className="flex flex-nowrap" data-testid="message-header:to">
            <span className="message-header-to container-to pl0-5">{!isLoading && c('Label').t`To:`}</span>
            <span className="message-header-contact text-ellipsis">
                {!isLoading && (
                    <>
                        {recipients.length
                            ? recipientsOrGroup.map((recipientOrGroup, index) => {
                                  const label = getRecipientOrGroupLabel(recipientOrGroup);

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
