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
    classnames,
    useModals
} from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { RecipientOrGroup } from '../../../models/address';
import { getRecipientLabel, getRecipientGroupLabel } from '../../../helpers/addresses';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { getContactsOfGroup } from '../../../helpers/contacts';
import { normalizeEmail } from '../../../helpers/addresses';
import { MESSAGE_ACTIONS } from '../../../constants';
import { OnCompose } from '../../../hooks/useCompose';

interface Props {
    recipientOrGroup: RecipientOrGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    showLockIcon?: boolean;
    contacts?: ContactEmail[];
    onCompose: OnCompose;
}

const HeaderRecipientItem = ({
    recipientOrGroup,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    contacts,
    onCompose
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    if (recipientOrGroup.group) {
        return (
            <span>
                {getRecipientGroupLabel(
                    recipientOrGroup?.group,
                    getContactsOfGroup(contacts, recipientOrGroup?.group?.group?.ID).length
                )}
            </span>
        );
    }

    const recipient = recipientOrGroup.recipient as Recipient;
    const contact = contacts?.find(({ Email }) => normalizeEmail(Email) === normalizeEmail(recipient.Address));
    const { ContactID } = contact || {};

    const handleCompose = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onCompose({
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: [recipientOrGroup.recipient as Recipient] } }
        });
        close();
    };

    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(recipient.Address);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        close();
    };

    const handleClickContact = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (ContactID) {
            createModal(<ContactDetailsModal contactID={ContactID} />);
            return;
        }

        createModal(
            <ContactModal
                properties={[
                    { field: 'email', value: recipient.Address || '' },
                    { field: 'fn', value: recipient.Name || '' }
                ]}
            />
        );
    };

    const icon = globalIcon ? globalIcon : mapStatusIcons ? mapStatusIcons[recipient.Address as string] : undefined;
    const label = getRecipientLabel(recipient);
    const initial = getInitial(label);

    return (
        <span className="flex flex-items-center flex-nowrap message-recipient-item">
            <span className="container-to container-to--item noprint">
                <button
                    ref={anchorRef}
                    onClick={toggle}
                    className="item-icon flex-item-noshrink rounded50 bg-white inline-flex stop-propagation mr0-5"
                >
                    <span className="mauto item-abbr" aria-hidden="true">
                        {initial}
                    </span>
                    <span className="mauto item-caret hidden" aria-hidden="true">
                        <Icon name="caret"></Icon>
                    </span>
                    <span className="sr-only">{c('Action').t`Address options`}</span>
                </button>
            </span>
            <Dropdown id={uid} originalPlacement="bottom" isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCompose}>
                        <Icon name="email" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Write to`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCopy}>
                        <Icon name="copy" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy address`}</span>
                    </DropdownMenuButton>
                    {ContactID ? (
                        <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                            <Icon name="contact" className="mr0-5 mt0-25" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View contact details`}</span>
                        </DropdownMenuButton>
                    ) : (
                        <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                            <Icon name="contact-add" className="mr0-5 mt0-25" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Create new contact`}</span>
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
            <span className={classnames(['flex flex-nowrap', showAddress && 'onmobile-flex-column'])}>
                <span className="ellipsis">{label}</span>
                <span className="flex flex-nowrap">
                    {showAddress && (
                        <span className="opacity-50 ml0-5 onmobile-ml0 ellipsis">&lt;{recipient.Address}&gt;</span>
                    )}
                    {showLockIcon && icon && (
                        <span className="flex pl0-25 pr0-25 flex-item-noshrink">
                            <EncryptionStatusIcon {...icon} />
                        </span>
                    )}
                </span>
            </span>
        </span>
    );
};

export default HeaderRecipientItem;
