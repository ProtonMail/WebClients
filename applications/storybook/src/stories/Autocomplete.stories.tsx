import React, { useState, useRef } from 'react';
import { AutocompleteTwo, Input, Icon, AutocompleteChangeEvent, AutocompleteRenderProps } from 'react-components';
import mdx from './Autocomplete.mdx'

export default {
    title: 'Proton UI / Autocomplete',
    component: AutocompleteTwo,
    parameters: {
        docs: {
            page: mdx,
        }
    }
}

export const single = () => {
    const options = [
        'henlo',
        'benlo',
        'schmenlo',
        'henlo and benlo',
        'benlo and schmenlo',
        'schmenlo and schmenlo'
    ];

    const [ value, setValue ] = useState(options[0]);

    return (
        <AutocompleteTwo
            id="autocomplete"
            value={value}
            options={options}
            onChange={({ value }) => setValue(value)}
            getOptionKey={v => v}
            getOptionLabel={v => v}
        >
            {({ inputValue, autocompleteValue, ...rest }) => <Input value={inputValue} {...rest} />}
        </AutocompleteTwo>
    );
}

const anchorStyle = {
    color: 'black',
    borderRadius: 4, 
    background: 'white',
    padding: 8,
    border: '1px solid gray', 
    display: 'flex',    
    alignItems: 'center'
}

const itemStyle = {
    borderRadius: 4,
    padding: 8,
    marginRight: 4,
    border: '1px solid gray',
    background: 'white',
    display: 'inline-block'
}

const iconStyle = {
    marginLeft: 8
}

const inputStyle = {
    padding: 8
}

export const multiple = () => {
    type V = { key: string, value: string, label: string };

    /*
     * The useRef is used here in order to preserve identity of the value to its
     * option between render cycles since the Select uses identity comparison to
     * determine which option is selected.
     */
    const { current: options } = useRef([
        { key: 'henlo', value: 'henlo', label: 'henlo' },
        { key: 'schmenlo', value: 'schmenlo', label: 'schmenlo' },
        { key: 'benlo', value: 'benlo', label: 'benlo' },
        { key: 'frenlo', value: 'frenlo', label: 'frenlo' },
        { key: 'menlo', value: 'menlo', label: 'menlo' }
    ])

    const [ values, setValues ] = useState<V []>([ options[0], options[1] ]);

    const handleValueItemDelete = (index: number) => {
        setValues(
            currentValues => [
                ...currentValues.slice(0, index),
                ...currentValues.slice(index + 1)
            ]
        )
    }

    const handleChange = ({ value }: AutocompleteChangeEvent<V[]>) => {
        setValues(value)
    }

    const renderAutocompleteInput = ({
        ref,
        inputValue,
        autocompleteValue,
        ...rest
    }: AutocompleteRenderProps<V []>) =>(
        <div style={anchorStyle} ref={ref}>
            {autocompleteValue.map(
                ({ label, key }, index) => (
                     <span key={key} style={itemStyle}>
                         {label}
                         <Icon
                             style={iconStyle}
                             name="delete"
                             onClick={() => handleValueItemDelete(index)}
                         />
                     </span>
                 )
            )}
            <input
                style={inputStyle}
                value={inputValue}
                placeholder="..."
                {...rest}
            />
        </div>
    )

    return (
        <AutocompleteTwo
            id="autocomplete"
            multiple
            value={values}
            options={options}
            onChange={handleChange}
        >
           {renderAutocompleteInput}
       </AutocompleteTwo>
    );
}
