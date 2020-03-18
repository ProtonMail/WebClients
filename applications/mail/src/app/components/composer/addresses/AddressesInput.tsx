import React, { useState, useEffect, ChangeEvent, MutableRefObject, useRef, MouseEvent } from 'react';
import { Input } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import AddressesRecipientItem from './AddressesRecipientItem';
import {
    inputToRecipient,
    contactToRecipient,
    recipientsWithoutGroup,
    recipientsToRecipientOrGroup
} from '../../../helpers/addresses';
import { ContactEmail, ContactGroup, ContactOrGroup } from '../../../models/contact';
import AddressesAutocomplete from './AddressesAutocomplete';
import AddressesGroupItem from './AddressesGroupItem';
import { RecipientGroup, Recipient } from '../../../models/address';

interface Props {
    id: string;
    recipients?: Recipient[];
    onChange: (value: Recipient[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    placeholder?: string;
}

const AddressesInput = ({
    id,
    recipients = [],
    onChange,
    inputFocusRef,
    contacts,
    contactGroups,
    placeholder
}: Props) => {
    const [inputModel, setInputModel] = useState('');
    const inputRef = useRef<HTMLInputElement>();

    const recipientsOrGroups = recipientsToRecipientOrGroup(recipients, contactGroups);

    const confirmInput = () => {
        onChange([...recipients, inputToRecipient(inputModel)]);
        setInputModel('');
    };

    useEffect(() => {
        if (inputFocusRef) {
            inputFocusRef.current = inputRef.current?.focus.bind(inputRef.current) || noop;
        }
    }, []);

    const handleInputChange = (event: ChangeEvent) => {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const values = value.split(';');

        if (values.length > 1) {
            onChange([...recipients, ...values.slice(0, -1).map(inputToRecipient)]);
            setInputModel(values[values.length - 1]);
        } else {
            setInputModel(input.value);
        }
    };

    const handleBlur = () => {
        if (inputModel.trim().length > 0) {
            confirmInput();
        }
    };

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        inputRef.current?.focus();
    };

    const handleRecipientChange = (toChange: Recipient) => (value: Recipient) => {
        onChange(recipients.map((recipient) => (recipient === toChange ? value : recipient)));
    };

    const handleRecipientRemove = (toRemove: Recipient) => () => {
        onChange(recipients.filter((recipient) => recipient !== toRemove));
    };

    const handleGroupChange = (toChange?: RecipientGroup) => (value: RecipientGroup) => {
        onChange([...recipientsWithoutGroup(recipients, toChange?.group?.Path), ...value.recipients]);
    };

    const handleGroupRemove = (toRemove?: RecipientGroup) => () => {
        onChange(recipientsWithoutGroup(recipients, toRemove?.group?.Path));
    };

    const handleInputKey = (event: KeyboardEvent) => {
        if ((event.key === 'Enter' || event.key === 'Tab') && inputModel.length !== 0) {
            confirmInput();
            event.preventDefault(); // Prevent tab to switch field
        }
        if (event.key === 'Backspace' && inputModel.length === 0 && recipientsOrGroups.length > 0) {
            const last = recipientsOrGroups[recipientsOrGroups.length - 1];
            if (last.recipient) {
                handleRecipientRemove(last.recipient)();
            } else {
                handleGroupRemove(last.group)();
            }
        }
    };

    const handleAutocompleteSelect = ({ contact, group }: ContactOrGroup) => {
        if (contact) {
            onChange([...recipients, contactToRecipient(contact)]);
        }
        if (group) {
            const groupContacts = contacts
                .filter((contact) => contact.LabelIDs?.includes(group.ID || ''))
                .map((contact) => contactToRecipient(contact, group.Path));
            onChange([...recipients, ...groupContacts]);
        }
        setInputModel('');
    };

    return (
        <AddressesAutocomplete
            inputRef={inputRef}
            contacts={contacts}
            contactGroups={contactGroups}
            onSelect={handleAutocompleteSelect}
            currentValue={recipients}
        >
            <div
                className="composer-addresses-container pm-field flex-item-fluid bordered-container pl1-25 pr1-25"
                onClick={handleClick}
            >
                {recipientsOrGroups.map((recipientsOrGroup, i) =>
                    recipientsOrGroup.recipient ? (
                        <AddressesRecipientItem
                            key={i}
                            recipient={recipientsOrGroup.recipient}
                            onChange={handleRecipientChange(recipientsOrGroup.recipient)}
                            onRemove={handleRecipientRemove(recipientsOrGroup.recipient)}
                        />
                    ) : (
                        <AddressesGroupItem
                            key={i}
                            recipientGroup={recipientsOrGroup.group}
                            contacts={contacts}
                            onChange={handleGroupChange(recipientsOrGroup.group)}
                            onRemove={handleGroupRemove(recipientsOrGroup.group)}
                        />
                    )
                )}
                <div className="flex-item-fluid flex flex-items-center">
                    <Input
                        id={id}
                        value={inputModel}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKey}
                        onBlur={handleBlur}
                        ref={inputRef}
                        placeholder={placeholder}
                        data-testid="composer-addresses-input"
                    />
                </div>
            </div>
        </AddressesAutocomplete>
    );
};

export default AddressesInput;
