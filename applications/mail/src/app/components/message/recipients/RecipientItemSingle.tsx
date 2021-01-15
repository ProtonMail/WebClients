import React, { useState, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    usePopperAnchor,
    generateUID,
    ContactModal,
    ContactDetailsModal,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useNotifications,
    useModals,
} from 'react-components';
import { OpenPGPKey } from 'pmcrypto';
import { ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { Recipient } from 'proton-shared/lib/interfaces';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { MESSAGE_ACTIONS } from '../../../constants';
import { OnCompose } from '../../../hooks/composer/useCompose';
import RecipientItemLayout from './RecipientItemLayout';
import TrustPublicKeyModal from '../modals/TrustPublicKeyModal';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useContactCache } from '../../../containers/ContactProvider';
import { getContactEmail } from '../../../helpers/addresses';

interface Props {
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    showLockIcon?: boolean;
    onCompose: OnCompose;
    signingPublicKey?: OpenPGPKey;
}

const RecipientItemSingle = ({
    recipient,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    onCompose,
    signingPublicKey,
}: Props) => {
    const [uid] = useState(generateUID('dropdown-recipient'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { contactsMap } = useContactCache();
    const { getRecipientLabel } = useRecipientLabel();

    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};
    const icon = globalIcon || (mapStatusIcons ? mapStatusIcons[recipient.Address as string] : undefined);
    const label = getRecipientLabel(recipient, true);
    const initial = getInitial(label);
    const showTrustPublicKey = !!signingPublicKey;

    const handleCompose = (event: MouseEvent) => {
        event.stopPropagation();
        onCompose({
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: [recipient] } },
        });
        close();
    };

    const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(recipient.Address, event.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        close();
    };

    const handleClickContact = (event: MouseEvent) => {
        event.stopPropagation();

        if (ContactID) {
            createModal(<ContactDetailsModal contactID={ContactID} />);
            return;
        }

        createModal(
            <ContactModal
                properties={[
                    { field: 'email', value: recipient.Address || '' },
                    { field: 'fn', value: recipient.Name || recipient.Address || '' },
                ]}
            />
        );
    };

    const handleClickTrust = (event: MouseEvent) => {
        event.stopPropagation();

        const contact: ContactWithBePinnedPublicKey = {
            emailAddress: recipient.Address || '',
            name: label,
            contactID: ContactID,
            isInternal: true,
            bePinnedPublicKey: signingPublicKey as OpenPGPKey,
        };

        createModal(<TrustPublicKeyModal contact={contact} />);
    };

    return (
        <RecipientItemLayout
            button={
                <>
                    <button
                        ref={anchorRef}
                        type="button"
                        onClick={toggle}
                        aria-expanded={isOpen}
                        className="item-icon flex-item-noshrink rounded inline-flex stop-propagation mr0-5"
                    >
                        <span className="mauto item-abbr" aria-hidden="true">
                            {initial}
                        </span>
                        <span className="mauto item-caret hidden" aria-hidden="true">
                            <Icon name="caret" />
                        </span>
                        <span className="sr-only">{c('Action').t`Address options`}</span>
                    </button>
                    <Dropdown id={uid} originalPlacement="bottom" isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                        <DropdownMenu>
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCompose}>
                                <Icon name="email" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`New message`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCopy}>
                                <Icon name="copy" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy address`}</span>
                            </DropdownMenuButton>
                            {ContactID ? (
                                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                                    <Icon name="contact" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`View contact details`}</span>
                                </DropdownMenuButton>
                            ) : (
                                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                                    <Icon name="contact-add" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`Create new contact`}</span>
                                </DropdownMenuButton>
                            )}
                            {showTrustPublicKey && (
                                <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickTrust}>
                                    <Icon name="contact" className="mr0-5 mt0-25" />
                                    <span className="flex-item-fluid mtauto mbauto">{c('Action')
                                        .t`Trust Public Key`}</span>
                                </DropdownMenuButton>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                </>
            }
            label={label}
            showAddress={showAddress}
            address={<>&lt;{recipient.Address}&gt;</>}
            title={`${label} <${recipient.Address}>`}
            icon={
                showLockIcon &&
                icon && (
                    <span className="flex ml0-25 flex-item-noshrink message-recipient-item-lockIcon">
                        <EncryptionStatusIcon {...icon} />
                    </span>
                )
            }
        />
    );
};

export default RecipientItemSingle;
