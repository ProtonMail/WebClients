import type { MouseEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    useModals,
    useNotifications,
    usePopperAnchor,
} from '@proton/components';
import RecipientDropdownItem from '@proton/components/containers/contacts/view/RecipientDropdownItem';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import generateUID from '@proton/utils/generateUID';

import { MESSAGE_ACTIONS } from '../../../constants';
import { useOnCompose } from '../../../containers/ComposeProvider';
import { ComposeTypes } from '../../../hooks/composer/useCompose';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import type { RecipientGroup } from '../../../models/address';
import type { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import GroupModal from '../modals/GroupModal';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    group: RecipientGroup;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    showDropdown?: boolean;
    isOutside?: boolean;
    customDataTestId?: string;
    hasHeading?: boolean;
}

const RecipientItemGroup = ({
    group,
    mapStatusIcons,
    globalIcon,
    showDropdown,
    isOutside,
    customDataTestId,
    hasHeading = false,
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
        <div className="text-left flex flex-nowrap items-center">
            <Icon name="users" className="mr-1" />
            <span>{labelText}</span>
        </div>
    );

    const handleCompose = (event: MouseEvent) => {
        event.stopPropagation();
        onCompose({
            type: ComposeTypes.newMessage,
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
                    size={{ maxWidth: DropdownSizeUnit.Viewport }}
                    originalPlacement="bottom"
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                >
                    <DropdownMenu>
                        {group.recipients.map((recipient) => {
                            return (
                                <RecipientDropdownItem
                                    displaySenderImage={!!recipient?.DisplaySenderImage}
                                    recipient={recipient}
                                    label={getRecipientLabel(recipient)}
                                    closeDropdown={close}
                                    key={recipient.Address}
                                    bimiSelector={recipient?.BimiSelector || undefined}
                                    simple={isOutside}
                                />
                            );
                        })}
                        <hr className="my-2" />
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={handleCompose}
                            data-testid="recipient:new-message-to-group"
                        >
                            <Icon name="pen-square" className="mr-2" />
                            <span className="flex-1 my-auto">{c('Action').t`New message`}</span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={handleCopy}
                            data-testid="recipient:copy-group-emails"
                        >
                            <Icon name="squares" className="mr-2" />
                            <span className="flex-1 my-auto">{c('Action').t`Copy addresses`}</span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={handleRecipients}
                            data-testid="recipient:view-group-recipients"
                        >
                            <Icon name="user" className="mr-2" />
                            <span className="flex-1 my-auto">{c('Action').t`View recipients`}</span>
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            }
            isOutside={isOutside}
            hasHeading={hasHeading}
            recipientOrGroup={{ group }}
            customDataTestId={customDataTestId}
        />
    );
};

export default RecipientItemGroup;
