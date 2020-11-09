import React from 'react';
import { c } from 'ttag';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import { MessageExtended } from '../../../models/message';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import { OnCompose } from '../../../hooks/useCompose';
import RecipientsList from './RecipientsList';

interface Props {
    message: MessageExtended;
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    onCompose: OnCompose;
    isLoading: boolean;
}

const RecipientsDetails = ({ message, mapStatusIcons, contacts, contactGroups, onCompose, isLoading }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message?.data || {};

    const undisclosedRecipients = ToList.length + CCList.length + BCCList.length === 0;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientsList
                        list={ToList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                        isLoading={isLoading}
                    />
                </RecipientType>
            )}
            {CCList.length > 0 && (
                <RecipientType label={c('Label').t`CC:`}>
                    <RecipientsList
                        list={CCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                        isLoading={isLoading}
                    />
                </RecipientType>
            )}
            {BCCList.length > 0 && (
                <RecipientType label={c('Label').t`BCC:`}>
                    <RecipientsList
                        list={BCCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCompose={onCompose}
                        isLoading={isLoading}
                    />
                </RecipientType>
            )}
            {undisclosedRecipients && (
                <RecipientType label={c('Label').t`To:`}>
                    <RecipientItem
                        recipientOrGroup={{}}
                        contacts={contacts}
                        onCompose={onCompose}
                        isLoading={isLoading}
                    />
                </RecipientType>
            )}
        </div>
    );
};

export default RecipientsDetails;
