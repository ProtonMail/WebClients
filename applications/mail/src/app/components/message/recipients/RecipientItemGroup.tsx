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
import { RecipientGroup } from '../../../models/address';
import RecipientItemLayout from './RecipientItemLayout';
import GroupModal from '../modals/GroupModal';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../../constants';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import RecipientDropdownItem from './RecipientDropdownItem';

interface Props {
    group: RecipientGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const RecipientItemGroup = ({ group, mapStatusIcons, globalIcon, showDropdown, isOutside }: Props) => {
    const { getGroupLabel, getRecipientLabel } = useRecipientLabel();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const groupsWithContactsMap = useGroupsWithContactsMap();
    const [uid] = useState(generateUID('dropdown-group'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const onCompose = useOnCompose();

    let addresses = group.recipients.map((recipient) => recipient.Address).join(', ');

    const labelText = getGroupLabel(group, true);

    const label = (
        <div className="text-left flex flex-nowrap">
            <Icon name="user-group" className="mr0-25 mt0-25" />
            <span>{labelText}</span>
        </div>
    );

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
            label={label}
            title={addresses}
            ariaLabelTitle={`${labelText} ${addresses}`}
            showDropdown={showDropdown}
            dropdrownAnchorRef={anchorRef}
            dropdownToggle={toggle}
            isDropdownOpen={isOpen}
            dropdownContent={
                <Dropdown
                    id={uid}
                    noMaxWidth
                    originalPlacement="bottom"
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                >
                    <DropdownMenu>
                        {group.recipients.map((recipient) => {
                            return (
                                <RecipientDropdownItem
                                    recipient={recipient}
                                    label={getRecipientLabel(recipient)}
                                    closeDropdown={close}
                                    key={recipient.Address}
                                />
                            );
                        })}
                        <hr className="my0-5" />
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
            }
            isOutside={isOutside}
        />
    );
};

export default RecipientItemGroup;
