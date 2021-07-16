import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import React from 'react';
import { c } from 'ttag';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';

interface Props {
    message?: Message;
    isLoading?: boolean;
    highlightKeywords?: boolean;
}

const RecipientsSimple = ({ message, isLoading, highlightKeywords = false }: Props) => {
    const { getRecipientsOrGroups, getRecipientOrGroupLabel } = useRecipientLabel();
    const { highlightMetadata } = useEncryptedSearchContext();
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
                                  const highlightedLabel =
                                      !!label && highlightKeywords ? highlightMetadata(label).resultJSX : label;

                                  return (
                                      <span
                                          key={index} // eslint-disable-line react/no-array-index-key
                                          title={label}
                                      >
                                          <span>{highlightedLabel}</span>
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
