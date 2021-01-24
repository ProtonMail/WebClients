import React from 'react';
import { c } from 'ttag';

import { OTHER_INFORMATION_FIELDS } from 'proton-shared/lib/contacts/constants';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import { ContactEmail, ContactProperties, ContactGroup } from 'proton-shared/lib/interfaces/contacts';

import ContactViewProperty from './ContactViewProperty';
import EncryptedIcon from './EncryptedIcon';
import Icon from '../icon/Icon';

const TITLES: { [key: string]: string } = {
    fn: c('Title').t`Display name`,
    email: c('Title').t`Email addresses`,
    tel: c('Title').t`Phone numbers`,
    adr: c('Title').t`Addresses`,
    other: c('Title').t`Other information`,
};

const ICONS: { [key: string]: string } = {
    fn: 'contact',
    email: 'email',
    tel: 'phone',
    adr: 'address',
    other: 'info',
};

interface Props {
    properties: ContactProperties;
    contactID: string;
    contactEmails: ContactEmail[];
    contactGroupsMap?: { [contactGroupID: string]: ContactGroup };
    ownAddresses: string[];
    field?: string;
    userKeysList: DecryptedKey[];
    leftBlockWidth?: string;
    rightBlockWidth?: string;
    isPreview?: boolean;
}

const ContactViewProperties = ({
    properties: allProperties,
    contactID,
    contactEmails,
    contactGroupsMap = {},
    ownAddresses,
    field,
    userKeysList,
    leftBlockWidth = 'w30',
    rightBlockWidth = 'w70',
    isPreview = false,
}: Props) => {
    const title = field ? TITLES[field] : TITLES.other;
    const iconName = field ? ICONS[field] : ICONS.other;
    const toExclude = ['photo', 'org'];
    const fields = field ? [field] : OTHER_INFORMATION_FIELDS.filter((field) => !toExclude.includes(field));

    const properties = allProperties.filter(({ field }) => fields.includes(field));

    if (!properties.length) {
        return null;
    }

    return (
        <div className="border-bottom mb1">
            <h3 className="mb1 flex flex-nowrap flex-items-center">
                <Icon name={iconName} className="mr0-5" />
                <span className="mr0-5">{title}</span>
                {field && ['email', 'fn'].includes(field) ? null : <EncryptedIcon className="flex" />}
            </h3>
            {properties.map((property, index) => {
                const contactEmail = contactEmails && contactEmails[index];
                const contactGroups =
                    contactEmail && contactEmail.LabelIDs.map((ID) => contactGroupsMap[ID]).filter(Boolean);

                return (
                    // here we are hiddenly using the fact that the emails in
                    // `properties` appear in the same order as in `contactEmails`
                    <ContactViewProperty
                        key={index.toString()}
                        contactID={contactID}
                        contactEmail={contactEmail}
                        contactGroups={contactGroups}
                        ownAddresses={ownAddresses}
                        property={property}
                        properties={allProperties}
                        userKeysList={userKeysList}
                        leftBlockWidth={leftBlockWidth}
                        rightBlockWidth={rightBlockWidth}
                        isPreview={isPreview}
                    />
                );
            })}
        </div>
    );
};

export default ContactViewProperties;
