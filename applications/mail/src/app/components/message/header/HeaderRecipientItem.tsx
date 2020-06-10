import React, { useState } from 'react';
import { c } from 'ttag';
import {
    usePopperAnchor,
    generateUID,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useNotifications,
    classnames
} from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { getInitial } from 'proton-shared/lib/helpers/string';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';

import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { RecipientOrGroup, Recipient } from '../../../models/address';
import { getRecipientLabel, getRecipientGroupLabel } from '../../../helpers/addresses';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { getContactsOfGroup } from '../../../helpers/contacts';
import { OnCompose } from '../../../containers/ComposerContainer';
import { MESSAGE_ACTIONS } from '../../../constants';

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
                    <span className="mauto item-abbr">{initial}</span>
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
