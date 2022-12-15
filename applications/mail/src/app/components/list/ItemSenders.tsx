import { useMemo } from 'react';

import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isProtonSender } from '../../helpers/elements';
import { getElementSenders } from '../../helpers/recipients';
import { useRecipientLabel } from '../../hooks/contact/useRecipientLabel';
import { Element } from '../../models/element';
import VerifiedBadge from './VerifiedBadge';

interface Props {
    element: Element;
    conversationMode: boolean;
    loading: boolean;
    unread: boolean;
    displayRecipients: boolean;
    isSelected: boolean;
}

const ItemSenders = ({ element, conversationMode, loading, unread, displayRecipients, isSelected }: Props) => {
    const { feature: protonBadgeFeature } = useFeature(FeatureCode.ProtonBadge);
    const { shouldHighlight, highlightMetadata } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();
    const { getRecipientsOrGroups, getRecipientOrGroupLabel } = useRecipientLabel();

    const senders = useMemo(() => {
        return getElementSenders(element, conversationMode, displayRecipients);
    }, [element, conversationMode, displayRecipients]);

    const sendersAsRecipientOrGroup = useMemo(() => {
        return getRecipientsOrGroups(senders);
    }, [senders]);

    if (!loading && displayRecipients && !senders) {
        return <>{c('Info').t`(No Recipient)`}</>;
    }

    return (
        <span className="text-ellipsis">
            {sendersAsRecipientOrGroup.map((sender, index) => {
                const isProton = isProtonSender(element, sender, displayRecipients) && protonBadgeFeature?.Value;
                const isLastItem = index === senders.length - 1;
                const recipientLabel = getRecipientOrGroupLabel(sender);
                // TODO remove before merge (for testing)
                console.log('real label', getRecipientOrGroupLabel(sender));
                // const recipientLabel = `Recipient wit a lot of text after for testing - ${index}`;

                // TODO do not use index?
                return (
                    <span key={`${recipientLabel}-${index}`}>
                        {highlightData ? highlightMetadata(recipientLabel, unread, true).resultJSX : recipientLabel}
                        {isProton && <VerifiedBadge selected={isSelected} />}
                        {!isLastItem && <span className="mx0-25">,</span>}
                    </span>
                );
            })}
        </span>
    );
};

export default ItemSenders;
