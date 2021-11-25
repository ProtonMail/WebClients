import { useState, RefObject, DragEvent, MouseEvent } from 'react';
import { c } from 'ttag';
import {
    Icon,
    Tooltip,
    useModals,
    classnames,
    usePopperAnchor,
    ContextMenu,
    DropdownMenu,
    DropdownMenuButton,
    useNotifications,
    useDragOver,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import AddressesGroupModal from './AddressesGroupModal';
import { RecipientGroup } from '../../../models/address';
import { useUpdateGroupSendInfo, MessageSendInfo } from '../../../hooks/useSendInfo';
import { DRAG_ADDRESS_KEY } from '../../../constants';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';

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
    const { createModal, getModal, hideModal, removeModal } = useModals();
    const { createNotification } = useNotifications();

    const groupsWithContactsMap = useGroupsWithContactsMap();
    const { getGroupLabel } = useRecipientLabel();

    const [modalID, setModalID] = useState<string | undefined>();

    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const {
        anchorRef: itemRef,
        isOpen: contextMenuIsOpen,
        open: openContextMenu,
        close: closeContextMenu,
    } = usePopperAnchor<HTMLDivElement>();

    const contactsInGroup = groupsWithContactsMap[recipientGroup?.group?.ID || '']?.contacts || [];
    const label = getGroupLabel(recipientGroup);

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
        setModalID(createModal(undefined));
    };

    const handleCloseGroupModal = () => {
        if (modalID === undefined) {
            return;
        }
        hideModal(modalID);
    };

    const handleRemoveGroupModal = () => {
        if (modalID === undefined) {
            return;
        }
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
                    'composer-addresses-item mt0-25 mb0-25 mr0-5 flex flex-nowrap flex-row max-w100 stop-propagation cursor-grab rounded',
                    dragged && 'composer-addresses-item-dragged',
                ])}
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                ref={itemRef}
                {...dragHandlers}
            >
                <span className="interactive flex flex-row flex-nowrap">
                    <span className="inline-flex composer-addresses-item-icon pl0-5 ml0-1 pr0-25 no-pointer-events-children h100">
                        <Icon name="user-group" size={12} color={recipientGroup?.group?.Color} className="mauto" />
                    </span>
                    <Tooltip title={c('Info').t`Click to view group details`}>
                        <span
                            className="composer-addresses-item-label mtauto mbauto pl0-25 text-ellipsis pr0-5"
                            onClick={handleOpenGroupModal}
                            onContextMenu={handleContextMenu}
                        >
                            {label}
                        </span>
                    </Tooltip>
                </span>

                <Tooltip title={c('Action').t`Remove`}>
                    <button
                        type="button"
                        className="composer-addresses-item-remove inline-flex p0-5 no-pointer-events-children h100 interactive"
                        onClick={handleRemove}
                    >
                        <Icon name="xmark" size={12} className="mauto" />
                        <span className="sr-only">{c('Action').t`Remove`}</span>
                    </button>
                </Tooltip>
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
                    <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleCopy}>
                        <Icon name="copy" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy addresses`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left flex flex-nowrap" onClick={handleOpenGroupModal}>
                        <Icon name="user" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View recipients`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap"
                        liClassName="dropdown-item--delete"
                        onClick={handleRemove}
                    >
                        <Icon name="circle-xmark" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Remove`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </ContextMenu>
        </>
    );
};

export default AddressesGroupItem;
