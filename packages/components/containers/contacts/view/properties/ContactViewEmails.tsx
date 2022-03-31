import { c } from 'ttag';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import ContactViewProperty from './ContactViewProperty';
import { ContactViewProperties } from './ContactViewProperties';
import { ContactEmailSettingsProps } from '../../modals/ContactEmailSettingsModal';
import { Button, Icon, Tooltip, Copy } from '../../../../components';
import { useUser, useNotifications } from '../../../../hooks';
import ContactGroupDropdown from '../../ContactGroupDropdown';
import ContactGroupLabels from '../../group/ContactGroupLabels';

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
}: Props) => {
    const [{ hasPaidMail }] = useUser();
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
                            <span className="flex-item-noshrink flex contact-view-actions">
                                {!isPreview && (
                                    <>
                                        {!isOwnAddress && (
                                            <Tooltip title={c('Title').t`Email settings`}>
                                                <Button icon color="weak" shape="outline" onClick={handleSettings}>
                                                    <Icon name="cog-wheel" alt={c('Action').t`Email settings`} />
                                                </Button>
                                            </Tooltip>
                                        )}
                                        {hasPaidMail ? (
                                            <ContactGroupDropdown
                                                icon
                                                color="weak"
                                                shape="outline"
                                                className="ml0-5"
                                                contactEmails={[contactEmail]}
                                                tooltip={c('Title').t`Contact group`}
                                            >
                                                <Icon name="users" alt={c('Action').t`Contact group`} />
                                            </ContactGroupDropdown>
                                        ) : (
                                            <Tooltip title={c('Title').t`Contact group`}>
                                                <Button icon onClick={onUpgrade} className="ml0-5">
                                                    <Icon name="users" alt={c('Action').t`Contact group`} />
                                                </Button>
                                            </Tooltip>
                                        )}
                                        <Copy
                                            className="ml0-5"
                                            value={email.value}
                                            onCopy={() => {
                                                createNotification({
                                                    text: c('Success').t`Email address copied to clipboard`,
                                                });
                                            }}
                                        />
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
