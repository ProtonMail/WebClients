import { KeyboardEvent, RefObject, forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { inputToRecipient } from '@proton/shared/lib/mail/recipient';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useCombinedRefs } from '../../../hooks';
import {
    AddressesAutocompleteItem,
    GroupsWithContactsMap,
    getContactGroupsAutocompleteItems,
    getContactsAutocompleteItems,
    getNumberOfMembersText,
    getRecipientFromAutocompleteItem,
} from '../../addressesAutomplete/helper';
import { AutocompleteList, useAutocomplete, useAutocompleteFilter } from '../../autocomplete';
import Icon from '../../icon/Icon';
import { Option } from '../../option';
import { Marks } from '../../text';
import InputField, { InputFieldProps } from '../field/InputField';
import Input from '../input/Input';

interface Props extends Omit<InputFieldProps<typeof Input>, 'value' | 'onChange'> {
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

        const [recipientsByAddress, recipientsByGroup] = useMemo(() => {
            return recipients.reduce<[Set<string>, Set<string>]>(
                (acc, { Address, Group }) => {
                    if (Address) {
                        acc[0].add(canonizeEmail(Address));
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
                    ({ Email }) => !recipientsByAddress.has(canonizeEmail(Email)) && !validate(Email)
                ),
                ...getContactGroupsAutocompleteItems(
                    contactGroups,
                    ({ Path, ID }) => !recipientsByGroup.has(Path) && !isGroupEmpty(ID)
                ),
            ];
        }, [filteredContactEmails, contactGroups, recipientsByAddress, recipientsByGroup]);

        const options = [...contactsAutocompleteItems];

        const safeAddRecipients = (newRecipients: Recipient[]) => {
            const uniqueNewRecipients = newRecipients.filter(({ Address }) => {
                return !validate(Address || '');
            });
            if (!uniqueNewRecipients.length) {
                return;
            }
            onAddRecipients(uniqueNewRecipients);
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
            const newRecipient = inputToRecipient(trimmedInput);
            const error = validate(newRecipient.Address || '');

            if (!error) {
                handleAddRecipient([newRecipient]);
            } else {
                onAddInvalidEmail?.();
                setEmailError(error);
            }
        };

        const handleSelect = (item: AddressesAutocompleteItem) => {
            handleAddRecipient(getRecipientFromAutocompleteItem(contactEmails, item));
        };

        const getData = useCallback((value) => {
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
            if (newValue === ';' || newValue === ',') {
                return;
            }

            if (!hasEmailPasting) {
                setInput(newValue);
                return;
            }

            const values = newValue.split(/[,;]/).map((value) => value.trim());
            if (values.length > 1) {
                safeAddRecipients(values.slice(0, -1).map(inputToRecipient));
                setInput(values[values.length - 1]);
                return;
            }

            setInput(newValue);
        };

        return (
            <>
                <InputField
                    {...rest}
                    {...inputProps}
                    dense
                    ref={useCombinedRefs(ref, inputRef)}
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
                    style={compact ? { height: 'auto', minHeight: 'auto' } : {}}
                    error={emailError}
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
                                    <div className="flex flex-nowrap flex-flex-align-items-center">
                                        <Icon
                                            name="circle-filled"
                                            color={option.value.Color}
                                            size={12}
                                            className="mr0-5 flex-item-noshrink flex-item-centered-vert"
                                        />
                                        <span className="mr0-5 text-ellipsis">
                                            <Marks chunks={chunks}>{text}</Marks>
                                        </span>
                                        {getNumberOfMembersText(option.value.ID, groupsWithContactsMap)}
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
