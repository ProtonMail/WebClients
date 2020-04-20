import React from 'react';
import { c } from 'ttag';
import { MapStatusIcons } from '../../../models/crypto';

import { Message } from '../../../models/message';
import { Recipient } from '../../../models/address';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { recipientsToRecipientOrGroup, getRecipientLabel, getRecipientGroupLabel } from '../../../helpers/addresses';
import { getContactsOfGroup } from '../../../helpers/contacts';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import RecipientItem from './HeaderRecipientItem';

interface Props {
    message?: Message;
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

interface ListProps {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
}

const RecipientsList = ({ list, mapStatusIcons, contacts, contactGroups }: ListProps) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list, contactGroups);

    return (
        <span className="flex-self-vcenter flex flex-column">
            {recipientsOrGroup.map((recipientOrGroup, index) => {
                if (recipientOrGroup.recipient) {
                    const icon = mapStatusIcons
                        ? mapStatusIcons[recipientOrGroup.recipient.Address as string]
                        : undefined;
                    return (
                        <span className="flex flex-items-center" key={index}>
                            {getRecipientLabel(recipientOrGroup.recipient)}{' '}
                            <span className="opacity-50">&lt;{recipientOrGroup.recipient.Address}&gt;</span>{' '}
                            {icon && (
                                <span className="flex pl0-25 pr0-25 flex-item-noshrink">
                                    <EncryptionStatusIcon {...icon} />
                                </span>
                            )}
                        </span>
                    );
                }
                return (
                    <span key={index}>
                        {getRecipientGroupLabel(
                            recipientOrGroup?.group,
                            getContactsOfGroup(contacts, recipientOrGroup?.group?.group?.ID).length
                        )}
                    </span>
                );
            })}
        </span>
    );
};

const HeaderRecipientsDetails = ({ message, mapStatusIcons, contacts, contactGroups }: Props) => {
    const { ToList = [], CCList = [], BCCList = [] } = message || {};

    return (
        <div className="flex flex-column">
            {ToList.length > 0 && (
                <RecipientItem label={c('Label').t`To:`}>
                    <RecipientsList
                        list={ToList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                    />
                </RecipientItem>
            )}
            {CCList.length > 0 && (
                <RecipientItem label={c('Label').t`CC:`}>
                    <RecipientsList
                        list={CCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                    />
                </RecipientItem>
            )}
            {BCCList.length > 0 && (
                <RecipientItem label={c('Label').t`BCC:`}>
                    <RecipientsList
                        list={BCCList}
                        mapStatusIcons={mapStatusIcons}
                        contacts={contacts}
                        contactGroups={contactGroups}
                    />
                </RecipientItem>
            )}
        </div>
    );
};

export default HeaderRecipientsDetails;
