import React from 'react';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { OnCompose } from '../../../hooks/useCompose';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    onCompose: OnCompose;
    isLoading: boolean;
}

const RecipientsList = ({ list, mapStatusIcons, onCompose, isLoading }: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    onCompose={onCompose}
                    isLoading={isLoading}
                />
            ))}
        </>
    );
};

export default RecipientsList;
