import React, { useState, useEffect, MutableRefObject, useRef, MouseEvent, Fragment } from 'react';
import { AddressesAutocomplete, classnames, useContactEmails, useContactGroups } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import AddressesRecipientItem from './AddressesRecipientItem';
import { recipientsWithoutGroup, getRecipientOrGroupKey } from '../../../helpers/addresses';
import AddressesGroupItem from './AddressesGroupItem';
import { RecipientGroup } from '../../../models/address';
import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { useAddressesInputDrag } from '../../../hooks/useAddressesInputDrag';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useContactCache } from '../../../containers/ContactProvider';

interface Props {
    id: string;
    recipients?: Recipient[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: Recipient[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    placeholder?: string;
    expanded?: boolean;
    dataTestId?: string;
}

const AddressesInput = ({
    id,
    recipients = [],
    messageSendInfo,
    onChange,
    inputFocusRef,
    placeholder,
    expanded = false,
    dataTestId,
}: Props) => {
    const { contactsMap: contactEmailsMap, groupsWithContactsMap } = useContactCache();
    const { getRecipientsOrGroups } = useRecipientLabel();
    const [contactEmails] = useContactEmails() as [ContactEmail[] | undefined, boolean, any];
    const [contactGroups] = useContactGroups();

    const inputRef = useRef<HTMLInputElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);

    const [recipientsOrGroups, setRecipientsOrGroups] = useState(() => getRecipientsOrGroups(recipients));

    useEffect(() => setRecipientsOrGroups(getRecipientsOrGroups(recipients)), [recipients]);

    useEffect(() => {
        if (inputFocusRef) {
            inputFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const isNonEmptyRecipient = ({ Address }: Recipient) => {
        return Address.trim();
    };

    const handleAddRecipient = (newRecipients: Recipient[]) => {
        const filteredRecipients = newRecipients.filter(isNonEmptyRecipient);
        if (!filteredRecipients.length) {
            return;
        }
        onChange([...recipients, ...filteredRecipients]);
    };

    const handleRecipientRemove = (toRemove: Recipient) => () => {
        onChange(recipients.filter((recipient) => recipient !== toRemove));
        inputRef.current?.focus();
    };

    const handleRecipientChange = (toChange: Recipient) => (value: Recipient) => {
        if (!isNonEmptyRecipient(value)) {
            return handleRecipientRemove(toChange)();
        }
        onChange(recipients.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleGroupChange = (toChange?: RecipientGroup) => (value: RecipientGroup) => {
        onChange([...recipientsWithoutGroup(recipients, toChange?.group?.Path), ...value.recipients]);
    };

    const handleGroupRemove = (toRemove?: RecipientGroup) => () => {
        onChange(recipientsWithoutGroup(recipients, toRemove?.group?.Path));
        inputRef.current?.focus();
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

    const {
        draggedRecipient,
        placeholderPosition,
        placeholderSize,
        containerDragHandlers,
        itemDragHandlers,
    } = useAddressesInputDrag(recipientsOrGroups, setRecipientsOrGroups, onChange);

    const dragPlaceholder = (
        <div
            className="composer-addresses-item-drag-placeholder mt0-25 mb0-25 mr0-5 max-w100 no-pointer-events"
            style={{ width: `${placeholderSize?.width}px`, height: `${placeholderSize?.height}px` }}
        />
    );

    return (
        <div className="composer-addresses-autocomplete w100 flex-item-fluid relative" ref={anchorRef}>
            <div
                className={classnames([
                    'composer-addresses-container flex-item-fluid',
                    !expanded && 'composer-addresses-container-closed field',
                ])}
                onClick={handleClick}
                {...containerDragHandlers}
            >
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
        </div>
    );
};

export default AddressesInput;
