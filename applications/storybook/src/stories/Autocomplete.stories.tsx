import React, { useState, useRef } from 'react';
import { AutocompleteTwo, Input, AutocompleteChangeEvent } from 'react-components';
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
    const [ value, setValue ] = useState<{ key: string, value: string, label: string }>({ key: 'henlo', value: 'henlo', label: 'henlo' });

    const options = [
        { key: 'henlo', value: 'henlo', label: 'henlo' },
        { key: 'schmenlo', value: 'schmenlo', label: 'schmenlo' },
        { key: 'benlo', value: 'benlo', label: 'benlo' }
    ];

    return (
        <AutocompleteTwo
            value={value}
            onChange={({ value }) => setValue(value)}
            id="autocomplete"
            options={options}
        >
            {({ input, value, ...rest }) => <Input value={input} {...rest} />}
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

    const [ values, setValues ] = useState<V []>([]);

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
   return (
        <AutocompleteTwo
            id="autocomplete"
            multiple
            value={values}
            options={options}
            onChange={handleChange}
        >
           {({ ref, input: inputValue, value, ...rest }) => (
               <div style={anchorStyle} ref={ref}>
                   {value.map(
                       (value, index) => (
                            <span key={value.key} style={itemStyle}>
                                {value.label}
                                <span
                                    style={iconStyle}
                                    onClick={() => handleValueItemDelete(index)}
                                >
                                    x
                                </span>
                            </span>
                        )
                   )}
                   <input style={inputStyle} value={inputValue} {...rest} />
               </div>
           )}
       </AutocompleteTwo>
   );
}
