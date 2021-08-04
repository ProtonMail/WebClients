import { useRef, useState } from 'react';
import {
    Autocomplete,
    AutocompleteList,
    Option,
    Input,
    SimpleAutocomplete,
    useAutocomplete,
    useAutocompleteFilter,
    Marks,
    Icon,
} from '@proton/components';
import mdx from './Autocomplete.mdx';

export default {
    title: 'Components / Autocomplete',
    component: Autocomplete,
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const String = () => {
    const options = [
        'henlo',
        'benlo',
        'schmenlo',
        'henlo and benlo',
        'benlo and schmenlo',
        'schmenlo and schmenlo',
        'renlo',
        'kenlo',
        'schmenlo',
        'henlo and kenlo',
        'lenlo and schmenlo',
        'achmenlo and lchmenlo',
    ];

    const [value, setValue] = useState(options[0]);

    return <SimpleAutocomplete id="autocomplete" value={value} options={options} onChange={setValue} />;
};

export const Complex = () => {
    const [value, setValue] = useState('');

    const options = [
        { value: 'henlo', label: 'Henló' },
        { value: 'schmenlo', label: 'Schmenlo' },
        { value: 'benlo', label: 'Benlo' },
        { value: 'frenlo', label: 'Frenlo' },
        { value: 'menlo', label: 'Ménlo' },
    ];

    return (
        <Autocomplete
            id="autocomplete"
            value={value}
            onChange={setValue}
            onSelect={({ label }) => setValue(label)}
            placeholder="Example"
            options={options}
            getData={({ label }) => label}
        />
    );
};

interface ServiceOption {
    value: string;
    label: string;
    icon: string;
}

export const Custom = () => {
    const [value, setValue] = useState('');
    const containerRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const options = ['reddit', 'twitter', 'yahoo', 'youtube'].map((service) => {
        return {
            value: service,
            label: service.charAt(0).toUpperCase() + service.slice(1),
            icon: service,
        };
    });

    const getData = ({ label }: ServiceOption) => label;

    const filteredOptions = useAutocompleteFilter(value, options, getData, 20, 0);

    const handleSelect = (optionValue: ServiceOption) => {
        setValue(optionValue.label);
    };

    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete({
        id: 'autocomplete',
        options: filteredOptions,
        onSelect: handleSelect,
        input: value,
        inputRef,
    });

    const handleSelectOption = (optionValue: ServiceOption) => {
        handleSelect(optionValue);
        onClose();
    };

    return (
        <>
            <Input
                {...inputProps}
                placeholder="Service"
                ref={inputRef}
                containerRef={containerRef}
                value={value}
                onChange={(event) => {
                    setValue(event.currentTarget.value.trimStart());
                }}
            />
            <AutocompleteList anchorRef={containerRef.current ? containerRef : inputRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    return (
                        <Option
                            key={text}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={handleSelectOption}
                        >
                            <Icon name={option.icon} /> <Marks chunks={chunks}>{text}</Marks> ({index})
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};
