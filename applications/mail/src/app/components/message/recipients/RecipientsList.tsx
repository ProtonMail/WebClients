import React from 'react';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { MapStatusIcons } from '../../../models/crypto';
import { recipientsToRecipientOrGroup } from '../../../helpers/addresses';
import RecipientItem from './RecipientItem';
import { OnCompose } from '../../../hooks/useCompose';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
    isLoading: boolean;
}

const RecipientsList = ({ list, mapStatusIcons, contacts, contactGroups, onCompose, isLoading }: Props) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list, contactGroups);

    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    contacts={contacts}
                    onCompose={onCompose}
                    isLoading={isLoading}
                />
            ))}
        </>
    );
};

export default RecipientsList;
