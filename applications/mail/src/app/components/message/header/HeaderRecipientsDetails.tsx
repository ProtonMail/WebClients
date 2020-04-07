import React from 'react';
import { c } from 'ttag';

import { Message } from '../../../models/message';
import { Recipient } from '../../../models/address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { recipientsToRecipientOrGroup, getRecipientLabel, getRecipientGroupLabel } from '../../../helpers/addresses';
import { getContactsOfGroup } from '../../../helpers/contacts';
import RecipientItem from './HeaderRecipientItem';

interface Props {
    message?: Message;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

interface ListProps {
    list: Recipient[];
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

const RecipientsList = ({ list, contacts, contactGroups }: ListProps) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list, contactGroups);

    return (
        <span className="flex-self-vcenter flex flex-column">
            {recipientsOrGroup.map((recipientOrGroup, index) =>
                recipientOrGroup.recipient ? (
                    <span key={index}>
                        {getRecipientLabel(recipientOrGroup.recipient)}{' '}
                        <span className="opacity-50">&lt;{recipientOrGroup.recipient.Address}&gt;</span>{' '}
                    </span>
                ) : (
                    <span key={index}>
                        {getRecipientGroupLabel(
                            recipientOrGroup?.group,
                            getContactsOfGroup(contacts, recipientOrGroup?.group?.group?.ID).length
                        )}
                    </span>
                )
            )}
        </span>
    );
};

const HeaderRecipientsDetails = ({ message = {}, contacts, contactGroups }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message;

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientItem label={c('Label').t`To:`}>
                    <RecipientsList list={ToList} contacts={contacts} contactGroups={contactGroups} />
                </RecipientItem>
            )}
            {CCList.length > 0 && (
                <RecipientItem label={c('Label').t`CC:`}>
                    <RecipientsList list={CCList} contacts={contacts} contactGroups={contactGroups} />
                </RecipientItem>
            )}
            {BCCList.length > 0 && (
                <RecipientItem label={c('Label').t`BCC:`}>
                    <RecipientsList list={BCCList} contacts={contacts} contactGroups={contactGroups} />
                </RecipientItem>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;
