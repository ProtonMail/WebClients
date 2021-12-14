import { Fragment } from 'react';
import { parseISO, isValid, format } from 'date-fns';
import { c } from 'ttag';
import { dateLocale } from '@proton/shared/lib/i18n';
import { clearType, getType, formatAdr } from '@proton/shared/lib/contacts/property';
import { getTypeLabels } from '@proton/shared/lib/helpers/contacts';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import {
    ContactProperty,
    ContactProperties,
    ContactEmail,
    ContactGroup,
} from '@proton/shared/lib/interfaces/contacts/Contact';

import { Copy, Button, Icon, Tooltip, RemoteImage } from '../../components';
import { useModals, useUser, useNotifications } from '../../hooks';
import { classnames } from '../../helpers';
import ContactEmailSettingsModal from './modals/ContactEmailSettingsModal';
import ContactLabelProperty from './ContactLabelProperty';
import ContactUpgradeModal from './ContactUpgradeModal';
import ContactGroupDropdown from './ContactGroupDropdown';
import ContactGroupLabels from './ContactGroupLabels';
import EncryptedIcon from './EncryptedIcon';

interface Props {
    property: ContactProperty;
    properties: ContactProperties;
    contactID: string;
    contactEmail: ContactEmail;
    contactGroups: ContactGroup[];
    ownAddresses: string[];
    userKeysList: DecryptedKey[];
    leftBlockWidth?: string;
    rightBlockWidth?: string;
    isSignatureVerified: boolean;
    isPreview: boolean;
}

const ContactViewProperty = ({
    property,
    properties,
    contactID,
    contactEmail,
    contactGroups = [],
    ownAddresses,
    userKeysList,
    leftBlockWidth = 'w30',
    rightBlockWidth = 'w70',
    isSignatureVerified,
    isPreview,
}: Props) => {
    const [{ hasPaidMail }] = useUser();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const types: { [key: string]: string } = getTypeLabels();

    const { field } = property;
    const cleanType = clearType(getType(property.type));
    const type = types[cleanType] || cleanType;
    const value = property.value as string;

    const getActions = () => {
        if (isPreview) {
            return null;
        }
        switch (field) {
            case 'email': {
                if (!contactEmail) {
                    return null;
                }
                const isOwnAddress = [...ownAddresses].includes(value);
                const handleSettings = () => {
                    createModal(
                        <ContactEmailSettingsModal
                            userKeysList={userKeysList}
                            contactID={contactID}
                            emailProperty={property}
                            properties={properties}
                        />
                    );
                };

                return (
                    <>
                        {!isOwnAddress && (
                            <Tooltip title={c('Title').t`Email settings`}>
                                <Button icon color="weak" shape="outline" onClick={handleSettings}>
                                    <Icon name="gear" alt={c('Action').t`Email settings`} />
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
                                <Icon name="user-group" alt={c('Action').t`Contact group`} />
                            </ContactGroupDropdown>
                        ) : (
                            <Tooltip title={c('Title').t`Contact group`}>
                                <Button icon onClick={() => createModal(<ContactUpgradeModal />)} className="ml0-5">
                                    <Icon name="user-group" alt={c('Action').t`Contact group`} />
                                </Button>
                            </Tooltip>
                        )}
                        <Copy
                            className="ml0-5"
                            value={value}
                            onCopy={() => {
                                createNotification({ text: c('Success').t`Email address copied to clipboard` });
                            }}
                        />
                    </>
                );
            }
            case 'tel':
                return (
                    <Copy
                        className="ml0-5 pt0-5 pb0-5 mt0-1"
                        value={value}
                        onCopy={() => {
                            createNotification({ text: c('Success').t`Phone number copied to clipboard` });
                        }}
                    />
                );
            case 'adr':
                return (
                    <Copy
                        className="ml0-5 pt0-5 pb0-5 mt0-1"
                        value={formatAdr(property.value).join(', ')}
                        onCopy={() => {
                            createNotification({ text: c('Success').t`Address copied to clipboard` });
                        }}
                    />
                );
            default:
                return null;
        }
    };

    const getContent = () => {
        if (field === 'email') {
            return (
                <>
                    <span className="w100 flex">
                        <a className="mr0-5 flex-item-fluid text-ellipsis" href={`mailto:${value}`} title={value}>
                            {value}
                        </a>
                        <span className="flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                    </span>
                    {!!contactGroups.length && (
                        <div className="mt1">
                            <ContactGroupLabels className="max-w100" contactGroups={contactGroups} isStacked={false} />
                        </div>
                    )}
                </>
            );
        }
        if (field === 'url') {
            // use new root address when the url does not include the protocol (HTTP or HTTPS)
            const href = value.startsWith('http') || value.startsWith('//') ? value : `//${value}`;
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {value}
                </a>
            );
        }
        if (field === 'tel') {
            return (
                <span className="w100 flex">
                    <a className="mr0-5 flex-item-fluid text-ellipsis" href={`tel:${value}`}>
                        {value}
                    </a>
                    <span className=" flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                </span>
            );
        }
        if (['bday', 'anniversary'].includes(field)) {
            const [date] = [parseISO(value), new Date(value)].filter(isValid);
            if (date) {
                return format(date, 'PP', { locale: dateLocale });
            }
            return value;
        }
        if (field === 'logo') {
            return <RemoteImage src={value} />;
        }
        if (field === 'adr') {
            const lines = formatAdr(property.value);
            return (
                <span className="w100 flex">
                    <span className="mr0-5 flex-item-fluid text-ellipsis">
                        {lines.map((line, index) => (
                            // No better key here and should not change in time anyway
                            // eslint-disable-next-line react/no-array-index-key
                            <Fragment key={index}>
                                {line}
                                {index !== lines.length - 1 && <br />}
                            </Fragment>
                        ))}
                    </span>
                    <span className="flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                </span>
            );
        }
        return value;
    };

    return (
        <div className="contact-view-row flex flex-nowrap flex-align-items-start mb1">
            <div
                className={classnames([
                    'contact-view-row-left flex flex-nowrap flex-item-fluid on-mobile-flex-column',
                    rightBlockWidth,
                ])}
            >
                <div
                    className={classnames([
                        'contact-view-row-label flex-no-min-children on-mobile-max-w100 flex-item-noshrink flex-align-items-start',
                        leftBlockWidth,
                    ])}
                >
                    <div className="inline-flex flex-item-noshrink flex-item-fluid flex-align-items-center">
                        <span role="heading" aria-level={3} className="mr0-5">
                            <ContactLabelProperty field={field} type={type} />
                        </span>
                        {field && ['email', 'fn'].includes(field) ? null : (
                            <EncryptedIcon className="flex" isSignatureVerified={isSignatureVerified} />
                        )}
                    </div>
                </div>
                <span
                    className={classnames([
                        'contact-view-row-content mr0-5 flex-item-fluid pl2 pt0-5 on-mobile-pl0',
                        !['note'].includes(field) && 'text-ellipsis',
                    ])}
                >
                    {getContent()}
                </span>
            </div>
        </div>
    );
};

export default ContactViewProperty;
