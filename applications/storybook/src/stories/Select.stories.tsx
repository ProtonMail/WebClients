import React, { useRef, useState } from 'react';
import { SelectTwo, Option, Icon } from 'react-components';
import mdx from './Select.mdx'

export default {
    title: 'Components / Select',
    component: SelectTwo,
    parameters: {
        docs: {
            page: mdx
        }
    }
}

export const basic = () => {
    const [ value, setValue ] = useState('ant');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
}

export const controlledOpenState = () => {
    const [ value, setValue ] = useState('ant');

    const [ open, setOpen ] = useState(false);
    
    function handleOpen () {
        setOpen(true)
    }
    
    function handleClose () {
        setOpen(false)
    }

    return (
        <SelectTwo
            isOpen={open}
            value={value}
            onChange={({ value: v }) => setValue(v)}
            onOpen={handleOpen}
            onClose={handleClose}
        >
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
}

export const withRichOptionContent = () => {
    const [ value, setValue ] = useState('reddit');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="Reddit" value="reddit">
                <Icon name="reddit"/> Reddit
            </Option>
            <Option title="Twitter" value="twitter">
                <Icon name="twitter"/> Twitter
            </Option>
            <Option title="Yahoo" value="yahoo">
                <Icon name="yahoo"/> Yahoo
            </Option>
            <Option title="Youtube" value="youtube">
                <Icon name="youtube"/> Youtube
            </Option>
        </SelectTwo>
    );
}

export const withCustomSearchClearTimer = () => {
    const [ value, setValue ] = useState('ant');

    return (
        <SelectTwo
            value={value}
            onChange={({ value: v }) => setValue(v)}
            clearSearchAfter={1000}
        >
            <Option title="Ant" value="ant" />
            <Option title="Bear" value="bear" />
            <Option title="Chimpanzee" value="chimpanzee" />
            <Option title="Deer" value="deer" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
}

export const withComplexValues = () => {
    /*
     * The useRef is used here in order to preserve identity of the value to its
     * option between render cycles since the Select uses identity comparison to
     * determine which option is selected.
     */
    const { current: options } = useRef([
        { name: 'ant' },
        { name: 'bear' },
        { name: 'chimpanzee' }
    ])

    const [ value, setValue ] = useState<{ name: string } | null>(options[0]);

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            {options.map(option => (
                <Option title={option.name} value={option} />
            ))}
        </SelectTwo>
    );
}
