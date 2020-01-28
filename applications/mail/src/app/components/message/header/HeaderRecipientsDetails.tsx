import React from 'react';
import { c } from 'ttag';
import { Message } from '../../../models/message';
import { Recipient } from '../../../models/address';
import { ContactEmail, ContactGroup } from '../../../models/contact';
import { recipientsToRecipientOrGroup, getRecipientLabel, getRecipientGroupLabel } from '../../../helpers/addresses';
import { getContactsOfGroup } from '../../../helpers/contacts';

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
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`To:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={ToList} contacts={contacts} contactGroups={contactGroups} />
                    </span>
                </span>
            )}
            {CCList.length > 0 && (
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`CC:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={CCList} contacts={contacts} contactGroups={contactGroups} />
                    </span>
                </span>
            )}
            {BCCList.length > 0 && (
                <span className="flex">
                    <span className="opacity-50 container-to">{c('Label').t`BCC:`}</span>
                    <span className="flex-self-vcenter mr1">
                        <RecipientsList list={BCCList} contacts={contacts} contactGroups={contactGroups} />
                    </span>
                </span>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;
