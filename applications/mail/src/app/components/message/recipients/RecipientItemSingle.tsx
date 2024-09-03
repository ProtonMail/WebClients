import type { ReactNode, RefObject } from 'react';
import { useState } from 'react';

import generateUID from '@proton/atoms/generateUID';
import { Dropdown, DropdownMenu, DropdownSizeUnit } from '@proton/components';
import RecipientDropdownItem from '@proton/components/containers/contacts/view/RecipientDropdownItem';
import type { Recipient } from '@proton/shared/lib/interfaces';

import type { MapStatusIcons, StatusIcon } from '../../../models/crypto';
import type { MessageState } from '../../../store/messages/messagesTypes';
import ItemAction from '../../list/ItemAction';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    message?: MessageState;
    recipient: Recipient;
    mapStatusIcons?: MapStatusIcons;
    globalIcon?: StatusIcon;
    isSmallViewport?: boolean;
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
    customDataTestId?: string;
    hasHeading?: boolean;
}

const RecipientItemSingle = ({
    message,
    recipient,
    mapStatusIcons,
    globalIcon,
    isSmallViewport,
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
    customDataTestId,
    hasHeading = false,
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
                    <span className="inline-flex shrink-0 message-recipient-item-lock-icon mr-1">
                        <EncryptionStatusIcon {...icon} />
                    </span>
                )
            }
            isSmallViewport={isSmallViewport}
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
                        <RecipientDropdownItem
                            displaySenderImage={!!recipient?.DisplaySenderImage}
                            recipient={recipient}
                            label={label}
                            closeDropdown={close}
                            bimiSelector={recipient?.BimiSelector || undefined}
                            simple={isOutside}
                        />
                        {customDropdownActions}
                    </DropdownMenu>
                </Dropdown>
            }
            isOutside={isOutside}
            isRecipient={isRecipient}
            recipientOrGroup={{ recipient }}
            customDataTestId={customDataTestId}
            hasHeading={hasHeading}
        />
    );
};

export default RecipientItemSingle;
