import { ReactNode, RefObject, useState } from 'react';
import { generateUID, Dropdown, DropdownMenu } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';
import { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import RecipientItemLayout from './RecipientItemLayout';
import RecipientDropdownItem from './RecipientDropdownItem';
import { MessageState } from '../../../logic/messages/messagesTypes';
import ItemAction from '../../list/ItemAction';

interface Props {
    message?: MessageState;
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    isNarrow?: boolean;
    showDropdown?: boolean;
    actualLabel?: string;
    customDropdownActions?: ReactNode;
    anchorRef: RefObject<HTMLButtonElement>;
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    isOutside?: boolean;
    hideAddress?: boolean;
    isRecipient?: boolean;
    isExpanded?: boolean;
}

const RecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    isNarrow,
    showDropdown,
    actualLabel,
    customDropdownActions,
    anchorRef,
    isOpen,
    toggle,
    close,
    isOutside,
    hideAddress = false,
    isRecipient = false,
    isExpanded = false,
}: Props) => {
    const [uid] = useState(generateUID('dropdown-recipient'));

    const label = actualLabel || recipient.Name || recipient.Address;

    const icon = globalIcon || (mapStatusIcons ? mapStatusIcons[recipient.Address as string] : undefined);

    // We don't want to show the address:
    // - If recipient has no name (in that case name = address)
    // - In mail recipients on collapsed mode
    // - In the collapsed message header
    const showAddress =
        (isExpanded && label !== recipient.Address) || (!isRecipient && !hideAddress && label !== recipient.Address);

    // If the message is has been forwarded, replied or replied all we want to display an icon
    const isActionLabel = message?.data?.IsForwarded || message?.data?.IsReplied || message?.data?.IsRepliedAll;

    return (
        <RecipientItemLayout
            label={label}
            itemActionIcon={<ItemAction element={message?.data} />}
            labelHasIcon={!!isActionLabel}
            showAddress={showAddress}
            address={`<${recipient.Address}>`}
            title={recipient.Address}
            ariaLabelTitle={`${label} <${recipient.Address}>`}
            icon={
                icon && (
                    <span className="inline-flex flex-item-noshrink message-recipient-item-lockIcon mr0-25">
                        <EncryptionStatusIcon {...icon} />
                    </span>
                )
            }
            isNarrow={isNarrow}
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
                        <RecipientDropdownItem recipient={recipient} label={label} closeDropdown={close} />
                        {customDropdownActions}
                    </DropdownMenu>
                </Dropdown>
            }
            isOutside={isOutside}
            isRecipient={isRecipient}
        />
    );
};

export default RecipientItemSingle;
