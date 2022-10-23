import { MouseEvent, useState } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    generateUID,
    useModals,
    useNotifications,
    usePopperAnchor,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { RecipientGroup } from '../../../models/address';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import GroupModal from '../modals/GroupModal';
import RecipientDropdownItem from './RecipientDropdownItem';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    group: RecipientGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showDropdown?: boolean;
    isOutside?: boolean;
    displaySenderImage: boolean;
    bimiSelector?: string;
}

const RecipientItemGroup = ({
    displaySenderImage,
    bimiSelector,
    group,
    mapStatusIcons,
    globalIcon,
    showDropdown,
    isOutside,
}: Props) => {
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
        <div className="text-left flex flex-nowrap flex-align-items-center">
            <Icon name="users" className="mr0-25" />
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
                                    displaySenderImage={displaySenderImage}
                                    recipient={recipient}
                                    label={getRecipientLabel(recipient)}
                                    closeDropdown={close}
                                    key={recipient.Address}
                                    bimiSelector={bimiSelector}
                                />
                            );
                        })}
                        <hr className="my0-5" />
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={handleCompose}
                        >
                            <Icon name="envelope" className="mr0-5" />
                            <span className="flex-item-fluid myauto">{c('Action').t`New message`}</span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={handleCopy}
                        >
                            <Icon name="squares" className="mr0-5" />
                            <span className="flex-item-fluid myauto">{c('Action').t`Copy addresses`}</span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={handleRecipients}
                        >
                            <Icon name="user" className="mr0-5" />
                            <span className="flex-item-fluid myauto">{c('Action').t`View recipients`}</span>
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            }
            isOutside={isOutside}
        />
    );
};

export default RecipientItemGroup;
