import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@proton/atoms';
import type { AddressesAutocompleteItem } from '@proton/components';
import {
    AutocompleteList,
    Marks,
    Option,
    getContactsAutocompleteItems,
    getRecipientFromAutocompleteItem,
    useAutocomplete,
    useAutocompleteFilter,
} from '@proton/components';
import { useContactEmails } from '@proton/components/hooks';

interface Props {
    id: string;
    anchorRef: React.RefObject<HTMLElement>;
    value: string | undefined;
    onChange: (recipient: string | undefined) => void;
    dataTestId?: string;
    placeholder?: string;
    classname?: string;
}

/**
 * Search a recipient from contacts list or enter a custom value
 * Contact groups not supported  because it implies multiple recipients.
 */
const AddressInput = ({ id, anchorRef, onChange, value, dataTestId, placeholder, classname }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState(value || '');
    const [contactEmails] = useContactEmails();
    const [selectedOptionEmail, setSelectedOptionEmail] = useState<string>('');

    const contactsAutocompleteItems = useMemo(
        () => getContactsAutocompleteItems(contactEmails, () => true),
        [contactEmails]
    );
    const filteredContactsAutocompleteItems = useMemo(() => {
        return contactsAutocompleteItems.filter((item) => item.value.Email !== selectedOptionEmail);
    }, [selectedOptionEmail, contactsAutocompleteItems]);

    const handleSelectOption = (item: AddressesAutocompleteItem) => {
        // Can't be a group so we can safely take the first item
        const recipient = getRecipientFromAutocompleteItem(contactEmails, item)[0];
        onChange(recipient.Address);
        setSearch(recipient.Address);
        setSelectedOptionEmail(recipient.Address);
    };
    const options = useAutocompleteFilter(
        search,
        filteredContactsAutocompleteItems,
        (value) => value.label,
        undefined,
        1
    );
    const { getOptionID, inputProps, suggestionProps } = useAutocomplete<AddressesAutocompleteItem>({
        id,
        options,
        onSelect: handleSelectOption,
        input: search,
        inputRef,
    });

    useEffect(() => {
        if (value !== search) {
            setSearch(value || '');
        }
    }, [value]);

    return (
        <div className="composer-addresses-autocomplete w-full flex-item-fluid relative">
            <Input
                className={classname}
                data-testid={dataTestId}
                type="search"
                value={search}
                onValue={(value: string) => {
                    const valueTrimmed = value.trimStart();
                    setSearch(valueTrimmed);
                    if (value !== selectedOptionEmail) {
                        setSelectedOptionEmail('');
                    }
                }}
                placeholder={placeholder}
                ref={inputRef}
                {...inputProps}
                onBlur={() => {
                    const input = search.trimStart();
                    onChange(input);
                    inputProps.onBlur();
                }}
                onKeyDown={(e) => {
                    if (options.length > 0) {
                        inputProps.onKeyDown(e);
                        return;
                    }
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = search.trimStart();
                        onChange(input);
                    }
                }}
            />
            <AutocompleteList anchorRef={anchorRef} {...suggestionProps}>
                {options.map(({ text, chunks, option }, index) => (
                    <Option
                        disableFocusOnActive
                        id={getOptionID(index)}
                        key={option.key}
                        onChange={handleSelectOption}
                        title={text}
                        value={option}
                    >
                        <Marks chunks={chunks}>{text}</Marks>
                    </Option>
                ))}
            </AutocompleteList>
        </div>
    );
};

export default AddressInput;
