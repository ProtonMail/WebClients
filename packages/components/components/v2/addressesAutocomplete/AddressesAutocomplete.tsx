import type { KeyboardEvent, RefObject } from 'react';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import type { Input } from '@proton/atoms';
import { AutocompleteList, useAutocomplete, useAutocompleteFilter } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import { useCombinedRefs } from '@proton/hooks';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { handleRecipientInputChange, inputToRecipient, splitBySeparator } from '@proton/shared/lib/mail/recipient';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { AddressesAutocompleteItem, GroupsWithContactsMap } from '../../addressesAutocomplete/helper';
import {
    getContactGroupsAutocompleteItems,
    getContactsAutocompleteItems,
    getNumberOfMembersCount,
    getNumberOfMembersText,
    getRecipientFromAutocompleteItem,
} from '../../addressesAutocomplete/helper';
import { Marks } from '../../text';
import type { InputFieldProps } from '../field/InputField';
import InputField from '../field/InputField';

interface Props extends Omit<InputFieldProps<typeof Input>, 'value' | 'onChange'> {
    id: string;
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    onAddRecipients: (recipients: Recipient[]) => void;
    recipients: Recipient[];
    anchorRef?: RefObject<HTMLElement>;
    contactEmails?: ContactEmail[];
    contactGroups?: ContactGroup[];
    contactEmailsMap?: SimpleMap<ContactEmail>;
    groupsWithContactsMap?: GroupsWithContactsMap;
    hasEmailPasting?: boolean;
    hasAddOnBlur?: boolean;
    limit?: number;
    onAddInvalidEmail?: () => void;
    validate?: (email: string) => string | void;
    onChange?: (value: string) => void;
    compact?: boolean;
    excludedEmails?: string[];
}

const AddressesAutocompleteTwo = forwardRef<HTMLInputElement, Props>(
    (
        {
            contactEmails,
            contactEmailsMap,
            contactGroups,
            groupsWithContactsMap,
            id,
            onKeyDown,
            recipients,
            onAddRecipients,
            anchorRef,
            hasEmailPasting = false,
            hasAddOnBlur = false,
            limit = 20,
            onAddInvalidEmail,
            onChange,
            validate = noop,
            compact,
            excludedEmails = [],
            ...rest
        }: Props,
        ref
    ) => {
        const [input, setInput] = useState('');
        const [emailError, setEmailError] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);
        const rootRef = useRef<HTMLDivElement>(null);

        const [recipientsByAddress, recipientsByGroup] = useMemo(() => {
            return recipients.reduce<[Set<string>, Set<string>]>(
                (acc, { Address, Group }) => {
                    if (Address) {
                        acc[0].add(canonicalizeEmail(Address));
                    }
                    if (Group) {
                        acc[1].add(Group);
                    }
                    return acc;
                },
                [new Set(), new Set()]
            );
        }, [recipients]);

        const isGroupEmpty = (groupID: string) => {
            return groupsWithContactsMap ? (groupsWithContactsMap[groupID]?.contacts.length || 0) <= 0 : false;
        };

        const filteredContactEmails = useMemo(
            () => contactEmails?.filter(({ Email }) => !excludedEmails.includes(Email)),
            [contactEmails, excludedEmails]
        );

        const contactsAutocompleteItems = useMemo(() => {
            return [
                ...getContactsAutocompleteItems(
                    filteredContactEmails,
                    ({ Email }) => !recipientsByAddress.has(canonicalizeEmail(Email)) && !validate(Email)
                ),
                ...getContactGroupsAutocompleteItems(
                    contactGroups,
                    ({ Path, ID }) => !recipientsByGroup.has(Path) && !isGroupEmpty(ID)
                ),
            ];
        }, [filteredContactEmails, contactGroups, recipientsByAddress, recipientsByGroup]);

        const options = [...contactsAutocompleteItems];

        const safeAddRecipients = (newRecipients: Recipient[]) => {
            const recipients = newRecipients.filter(({ Address }) => {
                return !validate(Address || '');
            });
            if (!recipients.length) {
                return;
            }
            onAddRecipients(recipients);
        };

        const handleAddRecipient = (newRecipients: Recipient[]) => {
            setInput('');
            setEmailError('');
            safeAddRecipients(newRecipients);
        };

        const handleAddRecipientFromInput = (input: string) => {
            const trimmedInput = input.trim();
            if (!trimmedInput.length) {
                setInput('');
                return;
            }

            const inputs = splitBySeparator(trimmedInput);
            const recipients = inputs.map((input) => inputToRecipient(input));
            const { validRecipients, invalidRecipients, errors } = recipients.reduce<{
                validRecipients: Recipient[];
                invalidRecipients: Recipient[];
                errors: string[];
            }>(
                (acc, recipient) => {
                    const error = validate(recipient.Address || '');
                    if (error) {
                        acc.errors.push(error);
                        acc.invalidRecipients.push(recipient);
                    } else {
                        acc.validRecipients.push(recipient);
                    }
                    return acc;
                },
                { validRecipients: [], invalidRecipients: [], errors: [] }
            );

            handleAddRecipient(validRecipients);

            if (errors.length) {
                onAddInvalidEmail?.();
                setEmailError(errors[0]);
                setInput(invalidRecipients.map(({ Address }) => Address).join(', '));
            }
        };

        const handleSelect = (item: AddressesAutocompleteItem) => {
            handleAddRecipient(getRecipientFromAutocompleteItem(contactEmails, item));
        };

        const getData = useCallback((value: { label: string }) => {
            return value.label;
        }, []);

        const filteredOptions = useAutocompleteFilter(input, options, getData, limit, 1);

        // If a group name is equal to the search input, we want to display it as the first option
        const exactNameGroup = filteredOptions.find(
            ({ option: { label, type } }) => label === input && type === 'group'
        );

        // Put the group at the first place if found
        const filteredAndSortedOptions = exactNameGroup
            ? [exactNameGroup, ...filteredOptions.filter(({ option: { label } }) => label !== input)]
            : filteredOptions;

        const { getOptionID, inputProps, suggestionProps } = useAutocomplete<AddressesAutocompleteItem>({
            id,
            options: filteredOptions,
            onSelect: handleSelect,
            input,
            inputRef,
        });

        const handleInputChange = (newValue: string) => {
            handleRecipientInputChange(newValue, hasEmailPasting, onAddRecipients, setInput);
        };

        return (
            <>
                <InputField
                    {...rest}
                    {...inputProps}
                    dense
                    ref={useCombinedRefs(ref, inputRef)}
                    rootRef={rootRef}
                    value={input}
                    onValue={(value: string) => {
                        handleInputChange(value.trimStart());
                        onChange?.(value);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        setEmailError('');
                        // If the default key down handler did not take care of this, add another layer
                        if (!inputProps.onKeyDown(event)) {
                            if (event.key === 'Enter') {
                                handleAddRecipientFromInput(input);
                                event.preventDefault();
                            }
                        }
                        onKeyDown?.(event);
                    }}
                    onBlur={() => {
                        inputProps.onBlur();
                        if (hasAddOnBlur) {
                            handleAddRecipientFromInput(input);
                        }
                    }}
                    className={clsx([rest.className, compact && 'border-none'])}
                    style={{
                        ...(compact ? { height: 'auto', minHeight: 'auto' } : {}),
                        ...(rest.style ? rest.style : {}),
                    }}
                    error={emailError}
                />
                <AutocompleteList anchorRef={anchorRef || rootRef} {...suggestionProps}>
                    {filteredAndSortedOptions.map(({ chunks, text, option }, index) => {
                        return (
                            <Option
                                key={option.key}
                                id={getOptionID(index)}
                                title={
                                    option.type === 'group'
                                        ? `${option.label} ${getNumberOfMembersText(
                                              option.value.ID,
                                              groupsWithContactsMap
                                          )}`
                                        : option.label
                                }
                                value={option}
                                disableFocusOnActive
                                onChange={handleSelect}
                            >
                                {option.type === 'group' ? (
                                    <div className="flex flex-nowrap *:items-center">
                                        <Icon
                                            name="circle-filled"
                                            color={option.value.Color}
                                            size={3}
                                            className="mr-2 shrink-0 self-center my-auto"
                                        />
                                        <span className="mr-2 text-ellipsis">
                                            <Marks chunks={chunks}>{text}</Marks>
                                        </span>
                                        <span className="color-weak text-no-wrap">
                                            {getNumberOfMembersCount(option.value.ID, groupsWithContactsMap)}
                                        </span>
                                    </div>
                                ) : (
                                    <Marks chunks={chunks}>{text}</Marks>
                                )}
                            </Option>
                        );
                    })}
                </AutocompleteList>
            </>
        );
    }
);

AddressesAutocompleteTwo.displayName = 'AddressesAutocompleteTwo';

export default AddressesAutocompleteTwo;
