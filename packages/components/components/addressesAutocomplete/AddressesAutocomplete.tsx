import type { KeyboardEvent, RefObject } from 'react';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import { AutocompleteList, useAutocomplete, useAutocompleteFilter } from '@proton/components';
import { useCombinedRefs } from '@proton/hooks';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { handleRecipientInputChange, inputToRecipient } from '@proton/shared/lib/mail/recipient';

import Icon from '../icon/Icon';
import type { Props as InputProps } from '../input/Input';
import Input from '../input/Input';
import { Option } from '../option';
import { Marks } from '../text';
import { Tooltip } from '../tooltip';
import type { AddressesAutocompleteItem, GroupsWithContactsMap } from './helper';
import {
    getContactGroupsAutocompleteItems,
    getContactsAutocompleteItems,
    getNumberOfMembersCount,
    getNumberOfMembersText,
    getRecipientFromAutocompleteItem,
} from './helper';

interface Props extends Omit<InputProps, 'value'> {
    id: string;
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    onAddRecipients: (recipients: Recipient[]) => void;
    recipients: Recipient[];
    anchorRef: RefObject<HTMLElement>;
    contactEmails?: ContactEmail[];
    contactGroups?: ContactGroup[];
    contactEmailsMap?: SimpleMap<ContactEmail>;
    groupsWithContactsMap?: GroupsWithContactsMap;
    hasEmailPasting?: boolean;
    hasAddOnBlur?: boolean;
    limit?: number;
}

const AddressesAutocomplete = forwardRef<HTMLInputElement, Props>(
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
            onChange,
            ...rest
        }: Props,
        ref
    ) => {
        const [input, setInput] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);

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

        const contactsAutocompleteItems = useMemo(() => {
            return [
                ...getContactsAutocompleteItems(
                    contactEmails,
                    ({ Email }) => !recipientsByAddress.has(canonicalizeEmail(Email))
                ),
                ...getContactGroupsAutocompleteItems(
                    contactGroups,
                    ({ Path, ID }) => !recipientsByGroup.has(Path) && !isGroupEmpty(ID)
                ),
            ];
        }, [contactEmails, contactGroups, recipientsByAddress, recipientsByGroup]);

        const handleAddRecipient = (newRecipients: Recipient[]) => {
            setInput('');
            onAddRecipients(newRecipients);
        };

        const handleAddRecipientFromInput = (input: string) => {
            const trimmedInput = input.trim();
            if (!trimmedInput.length) {
                setInput('');
                return;
            }
            const newRecipient = inputToRecipient(trimmedInput);
            handleAddRecipient([newRecipient]);
        };

        const handleSelect = (item: AddressesAutocompleteItem) => {
            handleAddRecipient(getRecipientFromAutocompleteItem(contactEmails, item));
        };

        const getData = useCallback((value: { label: string }) => {
            return value.label;
        }, []);

        const filteredOptions = useAutocompleteFilter(input, contactsAutocompleteItems, getData, limit, 1);

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
                <Input
                    {...rest}
                    {...inputProps}
                    ref={useCombinedRefs(ref, inputRef)}
                    value={input}
                    onChange={(event) => {
                        handleInputChange(event.currentTarget.value.trimStart());
                        onChange?.(event);
                    }}
                    onKeyDown={(event) => {
                        // If the default key down handler did not take care of this, add another layer
                        if (!inputProps.onKeyDown(event)) {
                            if (event.key === 'Enter') {
                                handleAddRecipientFromInput(input);
                                event.preventDefault();
                            }
                        }
                        onKeyDown?.(event);
                    }}
                    name="search" // only to avoid Safari suggest autocomplete
                    spellCheck={false}
                    autoCorrect="false"
                    onBlur={() => {
                        inputProps.onBlur();
                        if (hasAddOnBlur) {
                            handleAddRecipientFromInput(input);
                        }
                    }}
                />
                <AutocompleteList anchorRef={anchorRef} {...suggestionProps}>
                    {filteredAndSortedOptions.map(({ chunks, text, option }, index) => {
                        return (
                            <Option
                                key={option.key}
                                id={getOptionID(index)}
                                title={option.label}
                                value={option}
                                disableFocusOnActive
                                onChange={handleSelect}
                            >
                                {option.type === 'group' ? (
                                    <div className="flex flex-nowrap *:items-center gap-2">
                                        <Icon
                                            name="circle-filled"
                                            color={option.value.Color}
                                            size={3}
                                            className="shrink-0 self-center my-auto"
                                        />
                                        <span className="text-ellipsis">
                                            <Marks chunks={chunks}>{text}</Marks>
                                        </span>
                                        <Tooltip title={getNumberOfMembersText(option.value.ID, groupsWithContactsMap)}>
                                            <span className="shrink-0">
                                                {getNumberOfMembersCount(option.value.ID, groupsWithContactsMap)}
                                            </span>
                                        </Tooltip>
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
AddressesAutocomplete.displayName = 'AddressesAutocomplete';

export default AddressesAutocomplete;
