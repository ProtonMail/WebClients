import React from 'react';
import { parseISO, isValid, format } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from 'proton-shared/lib/i18n';
import { clearType, getType, formatAdr } from 'proton-shared/lib/contacts/property';
import { getTypeLabels } from 'proton-shared/lib/helpers/contacts';
import { DecryptedKey } from 'proton-shared/lib/interfaces';
import {
    ContactProperty,
    ContactProperties,
    ContactEmail,
    ContactGroup,
} from 'proton-shared/lib/interfaces/contacts/Contact';

import EncryptedIcon from './EncryptedIcon';

import ContactGroupDropdown from '../../containers/contacts/ContactGroupDropdown';
import ContactLabelProperty from './ContactLabelProperty';
import ContactEmailSettingsModal from '../../containers/contacts/modals/ContactEmailSettingsModal';
import { useModals, useUser, useNotifications } from '../../hooks';
import RemoteImage from '../image/RemoteImage';
import Tooltip from '../tooltip/Tooltip';
import { Copy, Button } from '../button';
import { classnames } from '../../helpers';
import Icon from '../icon/Icon';

import ContactUpgradeModal from './ContactUpgradeModal';
import ContactGroupLabels from '../../containers/contacts/ContactGroupLabels';

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
                                <Button icon color="weak" shape="outline" onClick={handleSettings} className="ml0-5">
                                    <Icon name="settings-singular" alt={c('Action').t`Email settings`} />
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
                                <Icon name="contacts-groups" alt={c('Action').t`Contact group`} />
                            </ContactGroupDropdown>
                        ) : (
                            <Tooltip title={c('Title').t`Contact group`}>
                                <Button icon onClick={() => createModal(<ContactUpgradeModal />)} className="ml0-5">
                                    <Icon name="contacts-groups" alt={c('Action').t`Contact group`} />
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
                        value={formatAdr(property?.value as string[])}
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
                    <span className="w100">
                        <span className="float-right flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                        <a className="mr0-5" href={`mailto:${value}`} title={value}>
                            {value}
                        </a>
                        {!!contactGroups.length && (
                            <div className="mt1">
                                <ContactGroupLabels
                                    className="max-w100"
                                    contactGroups={contactGroups}
                                    isStacked={false}
                                />
                            </div>
                        )}
                    </span>
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
                <span className="w100">
                    <span className="float-right flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                    <a href={`tel:${value}`}>{value}</a>
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
            return (
                <span className="w100">
                    <span className="float-right flex-item-noshrink flex contact-view-actions">{getActions()}</span>
                    {formatAdr(property.value as string[])}
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
                        {field && ['email', 'fn'].includes(field) ? null : <EncryptedIcon className="flex" />}
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
