import React from 'react';
import { c } from 'ttag';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { MessageExtended } from '../../../models/message';
import { MapStatusIcons } from '../../../models/crypto';
import { recipientsToRecipientOrGroup } from '../../../helpers/addresses';
import HeaderRecipientType from './HeaderRecipientType';
import HeaderRecipientItem from './HeaderRecipientItem';
import { OnCompose } from '../../../hooks/useCompose';

interface Props {
    message: MessageExtended;
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
    isLoading: boolean;
}

interface ListProps {
    message: MessageExtended;
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
    isLoading: boolean;
}

const RecipientsList = ({
    message,
    list,
    mapStatusIcons,
    contacts,
    contactGroups,
    onCompose,
    isLoading
}: ListProps) => {
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
                    isLoading={isLoading}
                    message={message}
                />
            ))}
        </>
    );
};

const HeaderRecipientsDetails = ({ message, mapStatusIcons, contacts, contactGroups, onCompose, isLoading }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

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
                        isLoading={isLoading}
                        message={message}
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
                        isLoading={isLoading}
                        message={message}
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
                        isLoading={isLoading}
                        message={message}
                    />
                </HeaderRecipientType>
            )}
            {undisclosedRecipients && (
                <HeaderRecipientType label={c('Label').t`To:`}>
                    <HeaderRecipientItem
                        recipientOrGroup={{}}
                        contacts={contacts}
                        onCompose={onCompose}
                        isLoading={isLoading}
                        message={message}
                    />
                </HeaderRecipientType>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;
