import React, { useState, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    usePopperAnchor,
    Icon,
    generateUID,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    useModals,
    useNotifications,
} from 'react-components';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { getInitial } from 'proton-shared/lib/helpers/string';

import { RecipientGroup } from '../../../models/address';
import RecipientItemLayout from './RecipientItemLayout';
import { MESSAGE_ACTIONS } from '../../../constants';
import { OnCompose } from '../../../hooks/composer/useCompose';
import GroupModal from '../modals/GroupModal';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useContactCache } from '../../../containers/ContactProvider';

interface Props {
    group: RecipientGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    onCompose: OnCompose;
}

const RecipientItemGroup = ({ group, mapStatusIcons, globalIcon, showAddress = true, onCompose }: Props) => {
    const { getGroupLabel } = useRecipientLabel();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { groupsWithContactsMap } = useContactCache();
    const [uid] = useState(generateUID('dropdown-group'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const label = getGroupLabel(group);
    const initial = getInitial(group.group?.Name);

    let addresses = group.recipients.map((recipient) => recipient.Address).join(', ');
    const allAddresses = addresses;
    if (group.recipients.length > 2) {
        const firstAddress = group.recipients[0].Address;
        const count = group.recipients.length - 1;
        addresses = c('Label').t`${firstAddress} and ${count} others`;
    }

    const handleCompose = (event: MouseEvent) => {
        event.stopPropagation();
        onCompose({
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: group.recipients } },
        });
        close();
    };

    const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(group.recipients.map((recipient) => recipient.Address).join(';'), event.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        close();
    };

    const handleRecipients = (event: MouseEvent) => {
        event.stopPropagation();
        createModal(
            <GroupModal
                recipientGroup={group}
                group={groupsWithContactsMap[group.group?.ID || '']}
                mapStatusIcons={mapStatusIcons}
                globalIcon={globalIcon}
            />
        );
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
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy addresses`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleRecipients}>
                                <Icon name="contact" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View recipients`}</span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </>
            }
            label={label}
            showAddress={showAddress}
            address={addresses}
            title={`${label} ${allAddresses}`}
        />
    );
};

export default RecipientItemGroup;
