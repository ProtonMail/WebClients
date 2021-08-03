import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { ContactEmail, ContactProperties, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import ContactViewProperty from './ContactViewProperty';
import { classnames } from '../../helpers';

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
    const toExclude = ['photo'];
    const fields = field ? [field] : OTHER_INFORMATION_FIELDS.filter((field) => !toExclude.includes(field));

    const properties = allProperties.filter(({ field }) => fields.includes(field));

    if (!properties.length) {
        return null;
    }

    return (
        <div className={classnames(['border-bottom mb0-5 pb0-25', field === 'fn' && 'mb1'])}>
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
