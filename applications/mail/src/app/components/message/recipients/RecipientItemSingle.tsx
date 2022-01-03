import { ReactNode, RefObject, useState } from 'react';
import { generateUID, Dropdown, DropdownMenu } from '@proton/components';
import { Recipient } from '@proton/shared/lib/interfaces';
import { HighlightMetadata } from '@proton/encrypted-search';
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
    showAddress?: boolean;
    showLockIcon?: boolean;
    isNarrow?: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    showDropdown?: boolean;
    actualLabel?: string;
    customDropdownActions?: ReactNode;
    anchorRef: RefObject<HTMLButtonElement>;
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
    isOutside?: boolean;
}

const RecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    showAddress = true,
    showLockIcon = true,
    isNarrow,
    highlightKeywords = false,
    highlightMetadata,
    showDropdown,
    actualLabel,
    customDropdownActions,
    anchorRef,
    isOpen,
    toggle,
    close,
    isOutside,
}: Props) => {
    const [uid] = useState(generateUID('dropdown-recipient'));

    const label = actualLabel || recipient.Name || recipient.Address;

    const icon = globalIcon || (mapStatusIcons ? mapStatusIcons[recipient.Address as string] : undefined);

    // We don't want to show the address in the collapsed mode unless the recipient Name = recipient Address
    // In this case, we want to display the Address only
    const actualShowAddress = showAddress ? showAddress : label === recipient.Address;

    // If the message is has been forwarded, replied or replied all we want to display an icon
    const isActionLabel = message?.data?.IsForwarded || message?.data?.IsReplied || message?.data?.IsRepliedAll;

    const canDisplayName = label !== recipient.Address;

    return (
        <RecipientItemLayout
            label={label}
            itemActionIcon={<ItemAction element={message?.data} />}
            labelHasIcon={!!isActionLabel}
            showAddress={actualShowAddress}
            address={recipient.Address}
            title={`${label} <${recipient.Address}>`}
            icon={
                showLockIcon &&
                icon && (
                    <span className="inline-flex ml0-25 flex-item-noshrink message-recipient-item-lockIcon">
                        <EncryptionStatusIcon {...icon} />
                    </span>
                )
            }
            canDisplayName={canDisplayName}
            isNarrow={isNarrow}
            highlightKeywords={highlightKeywords}
            highlightMetadata={highlightMetadata}
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
        />
    );
};

export default RecipientItemSingle;
