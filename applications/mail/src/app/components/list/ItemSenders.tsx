import { useMemo } from 'react';

import { c } from 'ttag';

import { ProtonBadgeType } from '@proton/components';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import uniqueBy from '@proton/utils/uniqueBy';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getElementSenders } from '../../helpers/recipients';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import type { Element } from '../../models/element';

interface Props {
    element: Element;
    conversationMode: boolean;
    loading: boolean;
    unread: boolean;
    displayRecipients: boolean;
    isSelected: boolean;
}

const ItemSenders = ({ element, conversationMode, loading, unread, displayRecipients, isSelected }: Props) => {
    const { shouldHighlight, highlightMetadata } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();
    const { getRecipientsOrGroups, getRecipientOrGroupLabel } = useRecipientLabel();

    const senders = useMemo(() => {
        const senders = getElementSenders(element, conversationMode, displayRecipients);
        return uniqueBy(senders, ({ Address }: Recipient) => canonicalizeInternalEmail(Address));
    }, [element, conversationMode, displayRecipients]);

    const sendersAsRecipientOrGroup = useMemo(() => {
        return getRecipientsOrGroups(senders);
    }, [senders]);

    const recipientsAddresses = useMemo(() => {
        return sendersAsRecipientOrGroup
            .map(({ recipient, group }) =>
                recipient ? recipient.Address : group?.recipients.map((recipient) => recipient.Address)
            )
            .flat()
            .join(', ');
    }, [sendersAsRecipientOrGroup]);

    if (!loading && displayRecipients && senders.length === 0) {
        return <>{c('Info').t`(No Recipient)`}</>;
    }

    return (
        <span
            className="inline-block max-w-full text-ellipsis"
            title={recipientsAddresses}
            data-testid="message-column:sender-address"
        >
            {sendersAsRecipientOrGroup.map((sender, index) => {
                const isLastItem = index === sendersAsRecipientOrGroup.length - 1;
                const recipientLabel = getRecipientOrGroupLabel(sender);

                // this fix works when there is 1 official recipient only (not with multiple), to be sure the official badge is shown
                if (isLastItem && index === 0 && !!sender.recipient?.IsProton) {
                    return (
                        <span
                            className="inline-flex items-center flex-nowrap max-w-full"
                            key={`${recipientLabel}-${index}`}
                        >
                            <span className="flex-1 text-ellipsis">
                                {highlightData
                                    ? highlightMetadata(recipientLabel, unread, true).resultJSX
                                    : recipientLabel}{' '}
                            </span>
                            {sender.recipient && <ProtonBadgeType recipient={sender.recipient} selected={isSelected} />}
                        </span>
                    );
                }
                return (
                    <span key={`${recipientLabel}-${index}`}>
                        {highlightData ? highlightMetadata(recipientLabel, unread, true).resultJSX : recipientLabel}
                        {sender.recipient && <ProtonBadgeType recipient={sender.recipient} selected={isSelected} />}
                        {!isLastItem && <span className="mr-1">,</span>}
                    </span>
                );
            })}
        </span>
    );
};

export default ItemSenders;
