import React, { useCallback, useMemo, useState } from 'react';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { Recipient } from 'proton-shared/lib/interfaces';
import { inputToRecipient } from 'proton-shared/lib/mail/recipient';
import { normalizeEmail, validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { c } from 'ttag';

import Input, { Props as InputProps } from '../input/Input';
import { Option } from '../option';
import { Marks } from '../text';
import { useAutocomplete, useAutocompleteFilter, AutocompleteList } from '../autocomplete';
import {
    getRecipientFromAutocompleteItem,
    AddressesAutocompleteItem,
    getContactsAutocompleteItems,
    getContactGroupsAutocompleteItems,
    getMajorListAutocompleteItems,
} from './helper';

interface Props extends Omit<InputProps, 'value' | 'onChange'> {
    id: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onAddRecipients: (recipients: Recipient[]) => void;
    recipients: Recipient[];
    anchorRef: React.RefObject<HTMLElement>;
    contactEmails?: ContactEmail[];
    contactGroups?: ContactGroup[];
    contactEmailsMap?: SimpleMap<ContactEmail>;
    hasEmailValidation?: boolean;
    hasEmailPasting?: boolean;
    hasAddOnBlur?: boolean;
    limit?: number;
    onAddInvalidEmail?: () => void;
}

const AddressesAutocomplete = React.forwardRef<HTMLInputElement, Props>(
    (
        {
            contactEmails,
            contactEmailsMap,
            contactGroups,
            id,
            onKeyDown,
            recipients,
            onAddRecipients,
            anchorRef,
            hasEmailValidation = false,
            hasEmailPasting = false,
            hasAddOnBlur = false,
            limit = 20,
            onAddInvalidEmail,
            ...rest
        }: Props,
        ref
    ) => {
        const [input, setInput] = useState('');
        const [emailError, setEmailError] = useState('');

        const [recipientsByAddress, recipientsByGroup] = useMemo(() => {
            return recipients.reduce<[Set<string>, Set<string>]>(
                (acc, { Address, Group }) => {
                    if (Address) {
                        acc[0].add(normalizeEmail(Address));
                    }
                    if (Group) {
                        acc[1].add(Group);
                    }
                    return acc;
                },
                [new Set(), new Set()]
            );
        }, [recipients]);

        const contactsAutocompleteItems = useMemo(() => {
            return [
                ...getContactsAutocompleteItems(
                    contactEmails,
                    ({ Email }) => !recipientsByAddress.has(normalizeEmail(Email))
                ),
                ...getContactGroupsAutocompleteItems(contactGroups, ({ Path }) => !recipientsByGroup.has(Path)),
            ];
        }, [contactEmails, contactGroups, recipientsByAddress, recipientsByGroup]);

        const majorList = useMemo(() => {
            return getMajorListAutocompleteItems(input, (email) => {
                const normalizedEmail = normalizeEmail(email);
                return !recipientsByAddress.has(normalizedEmail) && !contactEmailsMap?.[normalizedEmail];
            });
        }, [input, contactEmailsMap, recipientsByAddress]);

        const options = [...contactsAutocompleteItems, ...majorList];

        const getIsValidEmail = (input = '') => {
            return !hasEmailValidation ? true : validateEmailAddress(input);
        };

        const safeAddRecipients = (newRecipients: Recipient[]) => {
            const uniqueNewRecipients = newRecipients.filter(({ Address }) => {
                return getIsValidEmail(Address);
            });
            if (!uniqueNewRecipients.length) {
                return;
            }
            onAddRecipients(uniqueNewRecipients);
        };

        const handleAddRecipient = (newRecipients: Recipient[]) => {
            setInput('');
            safeAddRecipients(newRecipients);
        };

        const handleAddRecipientFromInput = (input: string) => {
            const trimmedInput = input.trim();
            if (!trimmedInput.length) {
                setInput('');
                return;
            }
            const newRecipient = inputToRecipient(trimmedInput);
            const isValidEmail = getIsValidEmail(newRecipient.Address || '');
            if (isValidEmail) {
                handleAddRecipient([newRecipient]);
            } else {
                onAddInvalidEmail?.();
                setEmailError(c('Error').t`Invalid email address`);
            }
        };

        const handleSelect = (item: AddressesAutocompleteItem) => {
            handleAddRecipient(getRecipientFromAutocompleteItem(contactEmails, item));
        };

        const getData = useCallback((value) => {
            return value.label;
        }, []);

        const filteredOptions = useAutocompleteFilter(input, options, getData, limit, 1);

        const { getOptionID, inputProps, suggestionProps } = useAutocomplete<AddressesAutocompleteItem>({
            id,
            options: filteredOptions,
            onSelect: handleSelect,
            input,
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
                <Input
                    {...rest}
                    {...inputProps}
                    ref={ref}
                    value={input}
                    onChange={(event) => {
                        handleInputChange(event.currentTarget.value.trimStart());
                    }}
                    onKeyDown={(event) => {
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
                    error={emailError}
                />
                <AutocompleteList anchorRef={anchorRef} {...suggestionProps}>
                    {filteredOptions.map(({ chunks, text, option }, index) => {
                        return (
                            <Option
                                key={option.key}
                                id={getOptionID(index)}
                                title={option.label}
                                value={option}
                                focusOnActive={false}
                                onChange={handleSelect}
                            >
                                <Marks chunks={chunks}>{text}</Marks>
                            </Option>
                        );
                    })}
                </AutocompleteList>
            </>
        );
    }
);

export default AddressesAutocomplete;
