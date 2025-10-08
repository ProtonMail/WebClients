import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import AutocompleteList from '@proton/components/components/autocomplete/AutocompleteList';
import { useAutocomplete, useAutocompleteFilter } from '@proton/components/components/autocomplete/useAutocomplete';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import Marks from '@proton/components/components/text/Marks';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { isValidHttpUrl } from '@proton/shared/lib/helpers/url';
import type { EduGainOrganization } from '@proton/shared/lib/interfaces';

interface Props {
    organizationData: EduGainOrganization[];
    organizationValue: EduGainOrganization;
    setOrganizationValue: (value: EduGainOrganization) => void;
}

const EduGainAutocomplete = ({ organizationData, organizationValue, setOrganizationValue }: Props) => {
    const [inputValue, setInputValue] = useState(organizationValue.EntityId || '');
    const [error, setError] = useState<string | undefined>(undefined);
    const containerRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const options = organizationData.map((org) => ({
        value: org,
        label: org.Name,
        text: org.EntityId,
    }));

    const getData = ({ text }: { text: string }) => text;

    const filteredOptions = useAutocompleteFilter(inputValue, options, getData, 20, 0);

    const handleSelect = (selectedOption: { value: EduGainOrganization }) => {
        setInputValue(selectedOption.value.EntityId);
        setOrganizationValue(selectedOption.value);
        setError(undefined);
    };

    const clearInput = () => {
        setInputValue('');
        setOrganizationValue({ EntityId: '', Name: '' });
        setError(undefined);
    };

    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete({
        id: 'edugain-autocomplete',
        options: filteredOptions,
        onSelect: handleSelect,
        input: inputValue,
        inputRef,
    });

    const handleInputChange = (newValue: string) => {
        if (!isValidHttpUrl(newValue) && newValue !== '') {
            setError(c('Error').t`Please enter a valid Entity ID URL`);
        } else {
            setError(undefined);
        }

        setInputValue(newValue);
        setOrganizationValue({
            ...organizationValue,
            EntityId: newValue,
            Name: '', // Empty value for custom EntityId
        });
    };

    return (
        <>
            <InputFieldTwo
                {...inputProps}
                autoFocus
                placeholder="https://"
                ref={inputRef}
                containerRef={containerRef}
                value={inputValue}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    handleInputChange(event.currentTarget.value.trim());
                }}
                error={error}
                label={c('Label').t`Entity ID URL`}
                suffix={
                    inputValue && (
                        <Button icon size="small" shape="ghost" title={c('Label').t`Remove`} onClick={clearInput}>
                            <Icon name="cross" />
                        </Button>
                    )
                }
            />
            <AutocompleteList anchorRef={containerRef.current ? containerRef : inputRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => (
                    <Option
                        key={option.value.EntityId}
                        id={getOptionID(index)}
                        title={text}
                        value={option}
                        disableFocusOnActive
                        onChange={() => {
                            handleSelect(option);
                            onClose();
                        }}
                    >
                        <Marks chunks={chunks}>{text}</Marks>
                        <span className="block color-weak">{option.value.Name}</span>
                    </Option>
                ))}
            </AutocompleteList>
        </>
    );
};

export default EduGainAutocomplete;
