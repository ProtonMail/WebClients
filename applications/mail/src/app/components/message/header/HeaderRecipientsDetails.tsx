import React from 'react';
import { c } from 'ttag';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { Message } from '../../../models/message';
import { MapStatusIcons } from '../../../models/crypto';
import { recipientsToRecipientOrGroup } from '../../../helpers/addresses';
import HeaderRecipientType from './HeaderRecipientType';
import HeaderRecipientItem from './HeaderRecipientItem';
import { OnCompose } from '../../../hooks/useCompose';

interface Props {
    message?: Message;
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
}

interface ListProps {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
}

const RecipientsList = ({ list, mapStatusIcons, contacts, contactGroups, onCompose }: ListProps) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list, contactGroups);

    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <HeaderRecipientItem
                    key={index}
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    contacts={contacts}
                    onCompose={onCompose}
                />
            ))}
        </>
    );
};

const HeaderRecipientsDetails = ({ message, mapStatusIcons, contacts, contactGroups, onCompose }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message || {};

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <HeaderRecipientType label={c('Label').t`To:`}>
                    <RecipientsList
                        list={ToList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                    />
                </HeaderRecipientType>
            )}
            {CCList.length > 0 && (
                <HeaderRecipientType label={c('Label').t`CC:`}>
                    <RecipientsList
                        list={CCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                    />
                </HeaderRecipientType>
            )}
            {BCCList.length > 0 && (
                <HeaderRecipientType label={c('Label').t`BCC:`}>
                    <RecipientsList
                        list={BCCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                    />
                </HeaderRecipientType>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;
