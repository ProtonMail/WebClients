import { useMemo } from 'react';

import { c } from 'ttag';

import { ProtonBadgeType } from '@proton/components/components';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import uniqueBy from '@proton/utils/uniqueBy';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getElementSenders } from '../../helpers/recipients';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import { Element } from '../../models/element';

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

    if (!loading && displayRecipients && !senders) {
        return <>{c('Info').t`(No Recipient)`}</>;
    }

    return (
        <span
            className="inline-block max-w100 text-ellipsis"
            title={recipientsAddresses}
            data-testid="message-column:sender-address"
        >
            {sendersAsRecipientOrGroup.map((sender, index) => {
                const isLastItem = index === sendersAsRecipientOrGroup.length - 1;
                const recipientLabel = getRecipientOrGroupLabel(sender);

                return (
                    <span key={`${recipientLabel}-${index}`}>
                        {highlightData ? highlightMetadata(recipientLabel, unread, true).resultJSX : recipientLabel}
                        {sender.recipient && <ProtonBadgeType recipient={sender.recipient} selected={isSelected} />}
                        {!isLastItem && <span className="mr0-25">,</span>}
                    </span>
                );
            })}
        </span>
    );
};

export default ItemSenders;
