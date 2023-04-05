import { Fragment, MouseEvent, MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AddressesAutocomplete,
    Icon,
    Tooltip,
    useContactEmails,
    useContactGroups,
    useNotifications,
} from '@proton/components';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { getRecipientOrGroupKey, recipientsWithoutGroup } from '../../../helpers/message/messageRecipients';
import { useContactsMap, useGroupsWithContactsMap } from '../../../hooks/contact/useContacts';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useAddressesInputDrag } from '../../../hooks/useAddressesInputDrag';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { RecipientGroup } from '../../../models/address';
import AddressesGroupItem from './AddressesGroupItem';
import AddressesRecipientItem from './AddressesRecipientItem';

interface Props {
    id: string;
    recipients: Recipient[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: Recipient[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    placeholder?: string;
    expanded?: boolean;
    dataTestId?: string;
    addContactButton?: string;
    addContactAction?: () => void;
    classname?: string;
    hasLighterFieldDesign?: boolean;
    anchorRef: RefObject<HTMLElement>;
}

const AddressesInput = ({
    id,
    recipients,
    messageSendInfo,
    onChange,
    inputFocusRef,
    placeholder,
    expanded = false,
    dataTestId,
    addContactButton,
    addContactAction,
    classname,
    hasLighterFieldDesign = false,
    anchorRef,
}: Props) => {
    const contactEmailsMap = useContactsMap();
    const groupsWithContactsMap = useGroupsWithContactsMap();

    const { getRecipientsOrGroups } = useRecipientLabel();
    const [contactEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const [contactGroups] = useContactGroups();

    const { createNotification } = useNotifications();

    const [recipientsOrGroups, setRecipientsOrGroups] = useState(() => getRecipientsOrGroups(recipients));

    const prevRecipientsOrGroupsLengthRef = useRef(recipientsOrGroups.length);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setRecipientsOrGroups(getRecipientsOrGroups(recipients)), [recipients]);

    useEffect(() => {
        if (inputFocusRef) {
            inputFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        // This click can get triggered if a modal is open, breaking the focus trap of the modal. The input re-focus
        // should only happen if clicking on the element to which the handler is attached or any of its descendants.
        if (!event.currentTarget.contains(event.target as Node)) {
            return;
        }
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const isNonEmptyRecipient = ({ Address }: Recipient) => {
        return Address.trim();
    };

    const showDuplicateNotif = (addresses: string[]) => {
        const recipents = addresses.length > 1 ? addresses.join(', ') : addresses[0];

        const text = c('Error').ngettext(
            msgid`Removed duplicate recipient: ${recipents}`,
            `Removed duplicate recipients: ${recipents}`,
            addresses.length
        );

        createNotification({
            text,
            type: 'warning',
        });
    };

    const handleAddRecipient = (newRecipients: Recipient[]) => {
        const filteredRecipients = newRecipients.filter(isNonEmptyRecipient);

        const duplicates: Recipient[] = [];

        const dedupRecipients = filteredRecipients.reduce<Recipient[]>((acc, recipient) => {
            if (recipients.some(({ Address }) => Address === recipient.Address)) {
                duplicates.push(recipient);
                return acc;
            }

            return [...acc, recipient];
        }, []);

        if (duplicates.length) {
            showDuplicateNotif(duplicates.map(({ Address }) => Address));
        }

        if (!dedupRecipients.length) {
            return;
        }

        onChange([...recipients, ...dedupRecipients]);
    };

    const handleRecipientRemove = (toRemove: Recipient) => () => {
        onChange(recipients.filter((recipient) => recipient !== toRemove));
    };

    const handleRecipientChange = (toChange: Recipient) => (value: Recipient) => {
        if (!isNonEmptyRecipient(value)) {
            return handleRecipientRemove(toChange)();
        }

        if (recipients.some(({ Address }) => Address === value.Address)) {
            showDuplicateNotif([value.Address]);
            return handleRecipientRemove(toChange)();
        }

        onChange(recipients.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleGroupChange = (toChange?: RecipientGroup) => (value: RecipientGroup) => {
        onChange([...recipientsWithoutGroup(recipients, toChange?.group?.Path), ...value.recipients]);
    };

    const handleGroupRemove = (toRemove?: RecipientGroup) => () => {
        onChange(recipientsWithoutGroup(recipients, toRemove?.group?.Path));
    };

    const handleInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && event.currentTarget.value.length === 0 && recipientsOrGroups.length > 0) {
            const last = recipientsOrGroups[recipientsOrGroups.length - 1];
            if (last.recipient) {
                handleRecipientRemove(last.recipient)();
            } else {
                handleGroupRemove(last.group)();
            }
        }
    };

    const { draggedRecipient, placeholderPosition, placeholderSize, containerDragHandlers, itemDragHandlers } =
        useAddressesInputDrag(recipientsOrGroups, setRecipientsOrGroups, onChange);

    const dragPlaceholder = (
        <div
            className="composer-addresses-item-drag-placeholder my-1 mr-2 max-w100 no-pointer-events h-custom w-custom"
            style={{
                '--w-custom': `${placeholderSize?.width}px`,
                '--h-custom': `${placeholderSize?.height}px`,
            }}
        />
    );

    useEffect(() => {
        const status: 'addedItem' | 'deletedItem' | 'equal' = (() => {
            if (recipientsOrGroups.length > prevRecipientsOrGroupsLengthRef.current) {
                return 'addedItem';
            } else if (recipientsOrGroups.length < prevRecipientsOrGroupsLengthRef.current) {
                return 'deletedItem';
            }
            return 'equal';
        })();

        // Be sure we scroll to the bottom of the container when we add items
        if (status === 'addedItem') {
            void (async function scrollAtContainerBottom() {
                // Tick processor needed to get scroll working
                await wait(0);
                scrollIntoView(containerRef.current, { block: 'end' });
            })();
        }

        prevRecipientsOrGroupsLengthRef.current = recipientsOrGroups.length;
    }, [recipientsOrGroups.length]);

    return (
        <div className={clsx(['composer-addresses-autocomplete w100 flex flex-item-fluid relative', classname])}>
            <div
                className={clsx([
                    'composer-addresses-container flex flex-nowrap flex-item-fluid',
                    !expanded && 'composer-addresses-container-closed field',
                    hasLighterFieldDesign && 'composer-light-field',
                ])}
                onClick={handleClick}
                aria-hidden="true"
                {...containerDragHandlers}
            >
                <div className="flex-item-fluid flex flex-wrap max-w100 max-h100 relative" ref={containerRef}>
                    {recipientsOrGroups.map((recipientOrGroup, index) => (
                        <Fragment key={getRecipientOrGroupKey(recipientOrGroup)}>
                            {index === placeholderPosition && dragPlaceholder}
                            {recipientOrGroup.recipient ? (
                                <AddressesRecipientItem
                                    recipient={recipientOrGroup.recipient}
                                    messageSendInfo={messageSendInfo}
                                    onChange={handleRecipientChange(recipientOrGroup.recipient)}
                                    onRemove={handleRecipientRemove(recipientOrGroup.recipient)}
                                    dragged={draggedRecipient === recipientOrGroup}
                                    {...itemDragHandlers(recipientOrGroup)}
                                />
                            ) : (
                                <AddressesGroupItem
                                    recipientGroup={recipientOrGroup.group as RecipientGroup}
                                    messageSendInfo={messageSendInfo}
                                    onChange={handleGroupChange(recipientOrGroup.group)}
                                    onRemove={handleGroupRemove(recipientOrGroup.group)}
                                    dragged={draggedRecipient === recipientOrGroup}
                                    {...itemDragHandlers(recipientOrGroup)}
                                />
                            )}
                        </Fragment>
                    ))}
                    {placeholderPosition === recipientsOrGroups.length && dragPlaceholder}
                    <div className="flex-item-fluid flex flex-align-items-center composer-addresses-input-container">
                        <AddressesAutocomplete
                            id={id}
                            anchorRef={anchorRef}
                            ref={inputRef}
                            contactEmails={contactEmails}
                            contactGroups={contactGroups}
                            contactEmailsMap={contactEmailsMap}
                            groupsWithContactsMap={groupsWithContactsMap}
                            recipients={recipients}
                            onAddRecipients={handleAddRecipient}
                            onKeyDown={handleInputKey}
                            placeholder={recipients.length > 0 ? '' : placeholder}
                            hasEmailPasting
                            hasAddOnBlur
                            data-testid={dataTestId}
                        />
                    </div>
                </div>
                {addContactButton ? (
                    <span className="flex-item-noshrink flex-align-self-start sticky-top">
                        <Tooltip title={c('Action').t`Insert contacts`}>
                            <Button
                                type="button"
                                tabIndex={-1}
                                onClick={addContactAction}
                                color="weak"
                                shape="ghost"
                                icon
                                data-testid="composer:to-button"
                            >
                                <Icon name="user-plus" size={16} alt={addContactButton} />
                            </Button>
                        </Tooltip>
                    </span>
                ) : null}
            </div>
        </div>
    );
};

export default AddressesInput;
