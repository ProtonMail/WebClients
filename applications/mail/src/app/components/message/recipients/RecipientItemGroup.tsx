import { useState, MouseEvent } from 'react';
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
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { RecipientGroup } from '../../../models/address';
import MailRecipientItem from './MailRecipientItem';
import GroupModal from '../modals/GroupModal';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';

interface Props {
    group: RecipientGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showAddress?: boolean;
    highlightKeywords?: boolean;
}

const RecipientItemGroup = ({
    group,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    highlightKeywords = false,
}: Props) => {
    const { getGroupLabel } = useRecipientLabel();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const groupsWithContactsMap = useGroupsWithContactsMap();
    const [uid] = useState(generateUID('dropdown-group'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const label = getGroupLabel(group);
    const initial = getInitials(group.group?.Name);

    const onCompose = useOnCompose();

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
        <MailRecipientItem
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
                            <Icon name="angle-down" />
                        </span>
                        <span className="sr-only">{c('Action').t`Address options`}</span>
                    </button>
                    <Dropdown id={uid} originalPlacement="bottom" isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                        <DropdownMenu>
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleCompose}>
                                <Icon name="envelope" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`New message`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleCopy}>
                                <Icon name="copy" className="mr0-5 mt0-25" />
                                <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy addresses`}</span>
                            </DropdownMenuButton>
                            <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleRecipients}>
                                <Icon name="user" className="mr0-5 mt0-25" />
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
            highlightKeywords={highlightKeywords}
        />
    );
};

export default RecipientItemGroup;
