import type { DragEvent, MouseEvent, RefObject } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import {
    ContextMenu,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useDragOver,
    useModalState,
    useNotifications,
    usePopperAnchor,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { DRAG_ADDRESS_KEY } from '../../../constants';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import type { MessageSendInfo } from '../../../hooks/useSendInfo';
import { useUpdateGroupSendInfo } from '../../../hooks/useSendInfo';
import type { RecipientGroup } from '../../../models/address';
import AddressesGroupModal from './AddressesGroupModal';

interface Props {
    recipientGroup: RecipientGroup;
    messageSendInfo?: MessageSendInfo;
    onChange: (value: RecipientGroup) => void;
    onRemove: () => void;
    dragged?: boolean;
    onDragStart: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    onDragOver: (ref: RefObject<HTMLDivElement>) => (event: DragEvent) => void;
}

const AddressesGroupItem = ({
    recipientGroup,
    messageSendInfo,
    onChange,
    onRemove,
    dragged = false,
    onDragStart,
    onDragEnd,
    onDragOver,
}: Props) => {
    const [modalProps, showModalCallback, showModal] = useModalState();
    const { createNotification } = useNotifications();

    const groupsWithContactsMap = useGroupsWithContactsMap();
    const { getGroupLabel } = useRecipientLabel();

    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const {
        anchorRef: itemRef,
        isOpen: contextMenuIsOpen,
        open: openContextMenu,
        close: closeContextMenu,
    } = usePopperAnchor<HTMLDivElement>();

    const contactsInGroup = groupsWithContactsMap[recipientGroup?.group?.ID || '']?.contacts || [];
    const label = getGroupLabel(recipientGroup);

    const { handleRemove, askForKeyPinningModal, contactResignModal } = useUpdateGroupSendInfo(
        messageSendInfo,
        contactsInGroup,
        onRemove
    );

    const handleContextMenu = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        if (contextMenuIsOpen) {
            closeContextMenu();
        }

        setContextMenuPosition({ top: event.clientY, left: event.clientX });
        openContextMenu();
    };

    const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        textToClipboard(recipientGroup.recipients.map((recipient) => recipient.Address).join(';'), event.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        closeContextMenu();
    };

    const [, dragHandlers] = useDragOver((event) => event.dataTransfer.types.includes(DRAG_ADDRESS_KEY), 'move', {
        onDragOver: onDragOver(itemRef),
    });

    return (
        <>
            <div
                className={clsx([
                    'composer-addresses-item flex flex-nowrap flex-row max-w-full overflow-hidden stop-propagation cursor-grab rounded',
                    dragged && 'composer-addresses-item-dragged',
                ])}
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                ref={itemRef}
                {...dragHandlers}
            >
                <span className="relative interactive-pseudo-inset flex flex-row flex-nowrap">
                    <span className="inline-flex shrink-0 composer-addresses-item-icon px-2 ml-0.5 *:pointer-events-none h-full">
                        <Icon name="users" size={3} color={recipientGroup?.group?.Color} className="m-auto" />
                    </span>
                    <Tooltip title={c('Info').t`Click to view group details`}>
                        <span
                            className="composer-addresses-item-label my-auto pl-1 pr-2 text-ellipsis"
                            onClick={() => showModalCallback(true)}
                            onContextMenu={handleContextMenu}
                        >
                            {label}
                        </span>
                    </Tooltip>
                </span>

                <Tooltip title={c('Action').t`Remove`}>
                    <button
                        type="button"
                        className="composer-addresses-item-remove inline-flex shrink-0 p-2 *:pointer-events-none h-full relative interactive-pseudo-inset"
                        onClick={handleRemove}
                    >
                        <Icon name="cross" size={3} className="m-auto" />
                        <span className="sr-only">{c('Action').t`Remove`}</span>
                    </button>
                </Tooltip>
            </div>
            {showModal && (
                <AddressesGroupModal
                    recipientGroup={recipientGroup}
                    contacts={contactsInGroup}
                    messageSendInfo={messageSendInfo}
                    onSubmit={onChange}
                    {...modalProps}
                />
            )}
            <ContextMenu
                isOpen={contextMenuIsOpen}
                close={closeContextMenu}
                position={contextMenuPosition}
                anchorRef={itemRef}
            >
                <DropdownMenu>
                    <DropdownMenuButton className="text-left flex flex-nowrap items-center" onClick={handleCopy}>
                        <Icon name="squares" className="mr-2" />
                        <span className="flex-1 my-auto">{c('Action').t`Copy addresses`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={() => showModalCallback(true)}
                    >
                        <Icon name="user" className="mr-2" />
                        <span className="flex-1 my-auto">{c('Action').t`View recipients`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        liClassName="dropdown-item--delete"
                        onClick={handleRemove}
                    >
                        <Icon name="cross-circle" className="mr-2" />
                        <span className="flex-1 my-auto">{c('Action').t`Remove`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </ContextMenu>
            {askForKeyPinningModal}
            {contactResignModal}
        </>
    );
};

export default AddressesGroupItem;
