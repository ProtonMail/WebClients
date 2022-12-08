import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { Copy, Icon, Tooltip } from '../../../../components';
import { useNotifications } from '../../../../hooks';
import ContactGroupDropdown from '../../ContactGroupDropdown';
import { ContactEmailSettingsProps } from '../../email/ContactEmailSettingsModal';
import { ContactGroupEditProps } from '../../group/ContactGroupEditModal';
import ContactGroupLabels from '../../group/ContactGroupLabels';
import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
    isPreview?: boolean;
    contactEmails: ContactEmail[];
    contactGroupsMap?: { [contactGroupID: string]: ContactGroup };
    ownAddresses: string[];
    contactID: string;
    onEmailSettings: (props: ContactEmailSettingsProps) => void;
    onGroupDetails: (contactGroupID: string) => void;
    onUpgrade: () => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
}

const ContactViewEmails = ({
    vCardContact,
    isSignatureVerified = false,
    isPreview = false,
    contactEmails,
    contactGroupsMap,
    ownAddresses,
    contactID,
    onEmailSettings,
    onGroupDetails,
    onUpgrade,
    onGroupEdit,
}: Props) => {
    const { createNotification } = useNotifications();

    const emails = getSortedProperties(vCardContact, 'email');

    if (emails.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties>
            {emails.map((email, i) => {
                const contactEmail = contactEmails && contactEmails[i];
                const contactGroups =
                    (contactEmail &&
                        contactGroupsMap &&
                        contactEmail.LabelIDs.map((ID) => contactGroupsMap[ID]).filter(Boolean)) ||
                    [];
                const isOwnAddress = [...ownAddresses].includes(email.value);

                const handleSettings = () => {
                    onEmailSettings({ contactID, vCardContact, emailProperty: email });
                };

                return (
                    <ContactViewProperty
                        // I have nothing better for the key there
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        field="email"
                        type={email.params?.type}
                        isSignatureVerified={isSignatureVerified}
                    >
                        <span className="w100 flex">
                            <a
                                className="mr0-5 flex-item-fluid text-ellipsis"
                                href={`mailto:${email.value}`}
                                title={email.value}
                            >
                                {email.value}
                            </a>
                            <span className="flex-item-noshrink flex py0-25 pr0-25 contact-view-actions">
                                {!isPreview && (
                                    <>
                                        <Copy
                                            className="ml0-5"
                                            value={email.value}
                                            onCopy={() => {
                                                createNotification({
                                                    text: c('Success').t`Email address copied to clipboard`,
                                                });
                                            }}
                                            data-testid={`${email.value}:email-copy`}
                                        />
                                        {!isOwnAddress && (
                                            <Tooltip title={c('Title').t`Email settings`}>
                                                <Button
                                                    icon
                                                    color="weak"
                                                    shape="outline"
                                                    className="ml0-5"
                                                    onClick={handleSettings}
                                                    data-testid={`${email.value}:email-settings`}
                                                >
                                                    <Icon name="cog-wheel" alt={c('Action').t`Email settings`} />
                                                </Button>
                                            </Tooltip>
                                        )}
                                        <ContactGroupDropdown
                                            icon
                                            color="weak"
                                            shape="outline"
                                            className="ml0-5"
                                            contactEmails={[contactEmail]}
                                            tooltip={c('Title').t`Contact group`}
                                            onGroupEdit={onGroupEdit}
                                            onUpgrade={onUpgrade}
                                            data-testid={`${email.value}:groups-dropdown`}
                                        >
                                            <Icon name="users" alt={c('Action').t`Contact group`} />
                                        </ContactGroupDropdown>
                                    </>
                                )}
                            </span>
                        </span>
                        {!!contactGroups.length && (
                            <div className="mt1">
                                <ContactGroupLabels
                                    className="max-w100"
                                    contactGroups={contactGroups}
                                    isStacked={false}
                                    onDetails={onGroupDetails}
                                />
                            </div>
                        )}
                    </ContactViewProperty>
                );
            })}
        </ContactViewProperties>
    );
};

export default ContactViewEmails;
