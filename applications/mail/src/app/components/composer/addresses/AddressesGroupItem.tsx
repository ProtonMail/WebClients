import React, { useState, RefObject, DragEvent, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    Icon,
    useModals,
    classnames,
    usePopperAnchor,
    ContextMenu,
    DropdownMenu,
    DropdownMenuButton,
    useNotifications,
} from 'react-components';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';

import AddressesGroupModal from './AddressesGroupModal';
import { getRecipientGroupLabel } from '../../../helpers/addresses';
import { RecipientGroup } from '../../../models/address';
import { getContactsOfGroup } from '../../../helpers/contacts';
import { useUpdateGroupSendInfo, MessageSendInfo } from '../../../hooks/useSendInfo';
import { useDragOver } from '../../../hooks/useDragOver';
import { DRAG_ADDRESS_KEY } from '../../../constants';

interface Props {
    recipientGroup: RecipientGroup;
    contacts: ContactEmail[];
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
    contacts,
    messageSendInfo,
    onChange,
    onRemove,
    dragged = false,
    onDragStart,
    onDragEnd,
    onDragOver,
}: Props) => {
    const { createModal, getModal, hideModal, removeModal } = useModals();
    const [modalID, setModalID] = useState();
    const { createNotification } = useNotifications();

    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const {
        anchorRef: itemRef,
        isOpen: contextMenuIsOpen,
        open: openContextMenu,
        close: closeContextMenu,
    } = usePopperAnchor<HTMLDivElement>();

    const contactsInGroup = getContactsOfGroup(contacts, recipientGroup?.group?.ID);
    const label = getRecipientGroupLabel(recipientGroup, contactsInGroup.length);

    const { handleRemove } = useUpdateGroupSendInfo(messageSendInfo, contactsInGroup, onRemove);

    const handleContextMenu = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        if (contextMenuIsOpen) {
            closeContextMenu();
        }

        setContextMenuPosition({ top: event.clientY, left: event.clientX });
        openContextMenu();
    };

    const handleOpenGroupModal = () => {
        setModalID(createModal());
    };

    const handleCloseGroupModal = () => {
        hideModal(modalID);
    };

    const handleRemoveGroupModal = () => {
        removeModal(modalID);
        setModalID(undefined);
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
                className={classnames([
                    'composer-addresses-item mt0-25 mb0-25 mr0-5 bordered-container flex flex-nowrap flex-row mw100 stop-propagation cursor-grab',
                    dragged && 'composer-addresses-item-dragged',
                ])}
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                ref={itemRef}
                {...dragHandlers}
            >
                <span className="inline-flex composer-addresses-item-icon pl0-5 pr0-5 no-pointer-events-children h100">
                    <Icon name="contacts-groups" size={12} color={recipientGroup?.group?.Color} className="mauto" />
                </span>
                <span
                    className="composer-addresses-item-label mtauto mbauto pl0-5 ellipsis pr0-5"
                    onClick={handleOpenGroupModal}
                    onContextMenu={handleContextMenu}
                >
                    {label}
                </span>
                <button
                    type="button"
                    className="composer-addresses-item-remove inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                    onClick={handleRemove}
                    title={c('Action').t`Remove`}
                >
                    <Icon name="off" size={12} className="mauto" />
                    <span className="sr-only">{c('Action').t`Remove`}</span>
                </button>
            </div>
            {modalID && (
                <AddressesGroupModal
                    recipientGroup={recipientGroup}
                    contacts={contactsInGroup}
                    messageSendInfo={messageSendInfo}
                    onSubmit={onChange}
                    onClose={handleCloseGroupModal}
                    onExit={handleRemoveGroupModal}
                    {...getModal(modalID)}
                />
            )}
            <ContextMenu
                isOpen={contextMenuIsOpen}
                close={closeContextMenu}
                position={contextMenuPosition}
                anchorRef={itemRef}
            >
                <DropdownMenu>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCopy}>
                        <Icon name="copy" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy addresses`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleOpenGroupModal}>
                        <Icon name="contact" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View recipients`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="alignleft flex flex-nowrap"
                        liClassName="dropDown-item--delete"
                        onClick={handleRemove}
                    >
                        <Icon name="delete" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Remove`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </ContextMenu>
        </>
    );
};

export default AddressesGroupItem;
