import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React, { useEffect, useRef, DragEvent, KeyboardEvent, RefObject, useState, MouseEvent } from 'react';
import {
    classnames,
    Icon,
    Tooltip,
    ContactDetailsModal,
    useModals,
    usePopperAnchor,
    ContextMenu,
    DropdownMenuButton,
    DropdownMenu,
    useNotifications,
    ContactModal,
} from 'react-components';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { recipientToInput, inputToRecipient, getContactEmail } from '../../../helpers/addresses';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';
import { useUpdateRecipientSendInfo, MessageSendInfo } from '../../../hooks/useSendInfo';
import { DRAG_ADDRESS_KEY } from '../../../constants';
import { useDragOver } from '../../../hooks/useDragOver';
import { useContactCache } from '../../../containers/ContactProvider';

interface Props {
    recipient: RequireSome<Recipient, 'Address' | 'ContactID'>;
    messageSendInfo?: MessageSendInfo;
    onChange?: (value: Recipient) => void;
    onRemove: () => void;
    dragged?: boolean;
    onDragStart?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDragOver?: (ref: RefObject<HTMLDivElement>) => (event: DragEvent) => void;
}

const AddressesRecipientItem = ({
    recipient,
    messageSendInfo,
    onChange = noop,
    onRemove,
    dragged = false,
    onDragStart,
    onDragEnd,
    onDragOver,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const { contactsMap } = useContactCache();

    const [editableMode, setEditableMode] = useState(false);

    const editableRef = useRef<HTMLSpanElement>(null);

    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const {
        anchorRef: itemRef,
        isOpen: contextMenuIsOpen,
        open: openContextMenu,
        close: closeContextMenu,
    } = usePopperAnchor<HTMLDivElement>();

    const { handleRemove } = useUpdateRecipientSendInfo(messageSendInfo, recipient, onRemove);

    const emailAddress = recipient.Address || '';
    const sendInfo = messageSendInfo?.mapSendInfo[emailAddress];
    const icon = sendInfo?.sendIcon;
    const loading = sendInfo?.loading;
    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;
    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};

    // Hide invalid when no send info or while loading
    const valid = !sendInfo || loading || (sendInfo?.emailValidation && !sendInfo?.emailAddressWarnings?.length);

    const confirmInput = () => {
        onChange(inputToRecipient(editableRef.current?.textContent as string));
    };

    const handleDoubleClick = () => {
        setEditableMode(true);
        setTimeout(() => editableRef.current?.focus());
    };

    const handleBlur = () => {
        setEditableMode(false);
        if (!editableRef.current || editableRef.current.textContent === recipientToInput(recipient)) {
            return;
        }
        confirmInput();
    };

    const handleInputKey = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            confirmInput();
            event.preventDefault();
            setEditableMode(false);
        }
    };

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
        textToClipboard(recipient.Address, event.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
        closeContextMenu();
    };

    const handleClickContact = (event: MouseEvent) => {
        event.stopPropagation();

        if (ContactID) {
            createModal(<ContactDetailsModal contactID={ContactID} />);
        } else {
            createModal(
                <ContactModal
                    properties={[
                        { field: 'email', value: recipient.Address || '' },
                        { field: 'fn', value: recipient.Name || recipient.Address || '' },
                    ]}
                />
            );
        }

        closeContextMenu();
    };

    useEffect(() => {
        const value = recipientToInput(recipient);

        if (editableRef.current) {
            editableRef.current.textContent = value;
        }
    }, []);

    const [, dragHandlers] = useDragOver((event) => event.dataTransfer.types.includes(DRAG_ADDRESS_KEY), 'move', {
        onDragOver: onDragOver?.(itemRef),
    });

    const title = sendInfo?.emailAddressWarnings?.[0]
        ? sendInfo?.emailAddressWarnings?.[0]
        : c('Info').t`Right-click for options`;

    return (
        <>
            <div
                className={classnames([
                    'composer-addresses-item bordered-container mt0-25 mb0-25 mr0-5 flex flex-nowrap flex-row mw100 stop-propagation',
                    !valid && 'invalid',
                    cannotSend && 'color-global-warning invalid',
                    dragged && 'composer-addresses-item-dragged',
                    !editableMode && 'cursor-grab',
                ])}
                data-dragover="composer-addresses-item"
                data-testid="composer-addresses-item"
                draggable={!editableMode}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                ref={itemRef}
                {...dragHandlers}
                {...rest}
            >
                {(icon || loading) && (
                    <span className="flex pl0-25 flex-item-noshrink">
                        <EncryptionStatusIcon loading={loading} {...icon} />
                    </span>
                )}
                <Tooltip className="flex" title={title}>
                    <span
                        className={classnames([
                            'composer-addresses-item-label mtauto mbauto ellipsis pr0-5',
                            icon || loading || !valid ? 'pl0-25' : 'pl0-5',
                        ])}
                        contentEditable={editableMode}
                        onDoubleClick={handleDoubleClick}
                        onBlur={handleBlur}
                        onKeyDown={handleInputKey}
                        onContextMenu={handleContextMenu}
                        ref={editableRef}
                    />
                </Tooltip>
                <Tooltip title={c('Action').t`Remove`} className="flex">
                    <button
                        type="button"
                        className="composer-addresses-item-remove border-left flex flex-item-noshrink pl0-25 pr0-25"
                        onClick={handleRemove}
                    >
                        <Icon name="off" size={12} className="mauto" />
                        <span className="sr-only">{c('Action').t`Remove`}</span>
                    </button>
                </Tooltip>
            </div>
            <ContextMenu
                isOpen={contextMenuIsOpen}
                close={closeContextMenu}
                position={contextMenuPosition}
                anchorRef={itemRef}
            >
                <DropdownMenu>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleCopy}>
                        <Icon name="copy" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy address`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleDoubleClick}>
                        <Icon name="compose" className="mr0-5 mt0-25" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Edit address`}</span>
                    </DropdownMenuButton>
                    {ContactID ? (
                        <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                            <Icon name="contact" className="mr0-5 mt0-25" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View contact details`}</span>
                        </DropdownMenuButton>
                    ) : (
                        <DropdownMenuButton className="alignleft flex flex-nowrap" onClick={handleClickContact}>
                            <Icon name="contact-add" className="mr0-5 mt0-25" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Create new contact`}</span>
                        </DropdownMenuButton>
                    )}
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

export default AddressesRecipientItem;
