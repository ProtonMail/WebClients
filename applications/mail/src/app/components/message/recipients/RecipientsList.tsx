import React from 'react';
import { Recipient } from '@proton/shared/lib/interfaces/Address';

import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
}

const RecipientsList = ({ list, mapStatusIcons, isLoading, highlightKeywords = false }: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                />
            ))}
        </>
    );
};

export default RecipientsList;
