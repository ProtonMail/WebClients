import React, { useState, useEffect, useMemo, ChangeEvent, MutableRefObject, useRef, MouseEvent } from 'react';
import { Input } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { ContactGroup, ContactEmail, ContactOrGroup } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { MAJOR_DOMAINS } from 'proton-shared/lib/constants';

import AddressesRecipientItem from './AddressesRecipientItem';
import {
    inputToRecipient,
    contactToRecipient,
    majorToRecipient,
    recipientsWithoutGroup,
    recipientsToRecipientOrGroup
} from '../../../helpers/addresses';
import AddressesAutocomplete from './AddressesAutocomplete';
import AddressesGroupItem from './AddressesGroupItem';
import { RecipientGroup } from '../../../models/address';
import { MessageSendInfo } from '../../../hooks/useSendInfo';

interface Props {
    id: string;
    recipients?: Recipient[];
    contacts: ContactEmail[];
    contactGroups: ContactGroup[];
    messageSendInfo?: MessageSendInfo;
    onChange: (value: Partial<Recipient>[]) => void;
    inputFocusRef?: MutableRefObject<() => void>;
    placeholder?: string;
}

const AddressesInput = ({
    id,
    recipients = [],
    contacts,
    contactGroups,
    messageSendInfo,
    onChange,
    inputFocusRef,
    placeholder,
    ...rest
}: Props) => {
    const [inputModel, setInputModel] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const recipientsOrGroups = recipientsToRecipientOrGroup(recipients, contactGroups);

    const majorDomains = useMemo(() => {
        if (!inputModel.includes('@')) {
            return [];
        }
        const [localPart = ''] = inputModel.split('@');
        if (!localPart) {
            return [];
        }
        return MAJOR_DOMAINS.map((domain) => `${localPart}@${domain}`);
    }, [inputModel]);

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

        if (value === ';') {
            return;
        }

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

    const handleInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
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

    const handleAutocompleteSelect = ({ contact, group, major }: ContactOrGroup) => {
        if (contact) {
            onChange([...recipients, contactToRecipient(contact)]);
        } else if (group) {
            const groupContacts = contacts
                .filter((contact) => contact.LabelIDs?.includes(group.ID || ''))
                .map((contact) => contactToRecipient(contact, group.Path));
            onChange([...recipients, ...groupContacts]);
        } else if (major) {
            onChange([...recipients, majorToRecipient(major)]);
        }
        setInputModel('');
    };

    return (
        <AddressesAutocomplete
            inputRef={inputRef}
            // Chrome ignores autocomplete="off" and Awesome lib forces autocomplete to "off" after instance
            autoComplete="no"
            contacts={contacts}
            contactGroups={contactGroups}
            majorDomains={majorDomains}
            onSelect={handleAutocompleteSelect}
            currentValue={recipients}
        >
            <div
                className="composer-addresses-container pm-field flex-item-fluid bordered-container"
                onClick={handleClick}
            >
                {recipientsOrGroups.map((recipientsOrGroup) =>
                    recipientsOrGroup.recipient ? (
                        <AddressesRecipientItem
                            key={recipientsOrGroup.recipient.Address}
                            recipient={
                                recipientsOrGroup.recipient as Required<Pick<Recipient, 'Address' | 'ContactID'>>
                            }
                            messageSendInfo={messageSendInfo}
                            onChange={handleRecipientChange(recipientsOrGroup.recipient)}
                            onRemove={handleRecipientRemove(recipientsOrGroup.recipient)}
                        />
                    ) : (
                        <AddressesGroupItem
                            key={recipientsOrGroup.group?.group?.ID}
                            recipientGroup={recipientsOrGroup.group as RecipientGroup}
                            messageSendInfo={messageSendInfo}
                            contacts={contacts}
                            onChange={handleGroupChange(recipientsOrGroup.group)}
                            onRemove={handleGroupRemove(recipientsOrGroup.group)}
                        />
                    )
                )}
                <div className="flex-item-fluid flex flex-items-center composer-addresses-input-container">
                    <Input
                        id={id}
                        value={inputModel}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKey}
                        onBlur={handleBlur}
                        ref={inputRef}
                        placeholder={placeholder}
                        data-testid="composer-addresses-input"
                        {...rest}
                    />
                </div>
            </div>
        </AddressesAutocomplete>
    );
};

export default AddressesInput;
