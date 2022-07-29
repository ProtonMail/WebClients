import { DragEvent, KeyboardEvent, MouseEvent, RefObject, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    ContextMenu,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Tooltip,
    classnames,
    useContactModals,
    useDragOver,
    useNotifications,
    usePopperAnchor,
} from '@proton/components';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { inputToRecipient, recipientToInput } from '@proton/shared/lib/mail/recipient';
import noop from '@proton/utils/noop';

import { DRAG_ADDRESS_KEY } from '../../../constants';
import { useOnMailTo } from '../../../containers/ComposeProvider';
import { getContactEmail } from '../../../helpers/addresses';
import { useContactsMap } from '../../../hooks/contact/useContacts';
import { MessageSendInfo, useUpdateRecipientSendInfo } from '../../../hooks/useSendInfo';
import { STATUS_ICONS_FILLS } from '../../../models/crypto';
import EncryptionStatusIcon from '../../message/EncryptionStatusIcon';

interface Props {
    recipient: Recipient;
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

    const contactsMap = useContactsMap();

    const [editableMode, setEditableMode] = useState(false);

    const editableRef = useRef<HTMLSpanElement>(null);

    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const {
        anchorRef: itemRef,
        isOpen: contextMenuIsOpen,
        open: openContextMenu,
        close: closeContextMenu,
    } = usePopperAnchor<HTMLDivElement>();

    const { handleRemove, askForKeyPinningModal, contactResignModal } = useUpdateRecipientSendInfo(
        messageSendInfo,
        recipient,
        onRemove
    );

    const onMailTo = useOnMailTo();
    const { modals, onDetails, onEdit } = useContactModals({ onMailTo });

    const emailAddress = recipient.Address || '';
    const sendInfo = messageSendInfo?.mapSendInfo[emailAddress];
    const icon = sendInfo?.sendIcon;
    const loading = sendInfo?.loading;
    const cannotSend = icon?.fill === STATUS_ICONS_FILLS.FAIL;
    const { ContactID } = getContactEmail(contactsMap, recipient.Address) || {};

    // Hide invalid when no send info or while loading
    const valid = !sendInfo || loading || (sendInfo?.emailValidation && !sendInfo?.emailAddressWarnings?.length);

    const confirmInput = () => {
        onChange(inputToRecipient(editableRef.current?.textContent?.trim() || ''));
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
            onDetails(ContactID);
        } else {
            onEdit({
                vCardContact: {
                    fn: [
                        {
                            field: 'fn',
                            value: recipient.Name || recipient.Address || '',
                            uid: createContactPropertyUid(),
                        },
                    ],
                    email: [{ field: 'email', value: recipient.Address || '', uid: createContactPropertyUid() }],
                },
            });
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
                    'composer-addresses-item mt0-25 mb0-25 mr0-5 flex flex-nowrap flex-row max-w100 overflow-hidden stop-propagation rounded',
                    !valid && 'invalid',
                    cannotSend && 'color-danger invalid',
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
                <span className="interactive flex flex-row flex-nowrap">
                    {(icon || loading) && (
                        <span className="flex pl0-5 flex-item-noshrink">
                            <EncryptionStatusIcon loading={loading} {...icon} />
                        </span>
                    )}
                    <Tooltip title={title}>
                        <span
                            className={classnames([
                                'composer-addresses-item-label mtauto mbauto text-ellipsis pr0-5',
                                icon || loading || !valid ? 'pl0-25' : 'pl0-5',
                            ])}
                            contentEditable={editableMode}
                            onDoubleClick={handleDoubleClick}
                            onBlur={handleBlur}
                            onKeyDown={handleInputKey}
                            onContextMenu={handleContextMenu}
                            ref={editableRef}
                            data-testid="composer-addresses-item-label"
                        />
                    </Tooltip>
                </span>
                <Tooltip title={c('Action').t`Remove`}>
                    <button
                        type="button"
                        className="composer-addresses-item-remove flex flex-item-noshrink p0-5 interactive"
                        onClick={handleRemove}
                        data-testid={`remove-address-button-${recipient.Address}`}
                    >
                        <Icon name="cross" size={12} className="mauto" />
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
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap flex-align-items-center"
                        onClick={handleCopy}
                    >
                        <Icon name="squares" className="mr0-5" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Copy address`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap flex-align-items-center"
                        onClick={handleDoubleClick}
                    >
                        <Icon name="pen" className="mr0-5" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Edit address`}</span>
                    </DropdownMenuButton>
                    {ContactID ? (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={handleClickContact}
                        >
                            <Icon name="user" className="mr0-5" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`View contact details`}</span>
                        </DropdownMenuButton>
                    ) : (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap flex-align-items-center"
                            onClick={handleClickContact}
                        >
                            <Icon name="user-plus" className="mr0-5" />
                            <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Create new contact`}</span>
                        </DropdownMenuButton>
                    )}
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap flex-align-items-center border-top"
                        liClassName="dropdown-item--delete"
                        onClick={handleRemove}
                    >
                        <Icon name="cross-circle" className="mr0-5" />
                        <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Remove`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </ContextMenu>
            {askForKeyPinningModal}
            {contactResignModal}
            {modals}
        </>
    );
};

export default AddressesRecipientItem;
