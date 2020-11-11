import React, { useState } from 'react';
import { SelectTwo, Option, Icon } from 'react-components';

export default {
    component: SelectTwo,
    title: 'Proton UI / Select'
};

export const Basic = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo aria-label={value} value={value} onChange={({ value: v }) => setValue(v)}>
            <Option value="ant">Ant</Option>
            <Option value="zebra">Zebra</Option>
        </SelectTwo>
    );
}

export const controlledOpenState = () => {
    const [ value, setValue ] = useState('');

    const [ open, setOpen ] = useState(false);
    
    function handleOpen () {
        setOpen(true)
    }
    
    function handleClose () {
        setOpen(false)
    }

    return (
        <SelectTwo
            aria-label={value}
            isOpen={open}
            value={value}
            onChange={({ value: v }) => setValue(v)}
            onOpen={handleOpen}
            onClose={handleClose}
        >
            <Option value="ant">Ant</Option>
            <Option value="zebra">Zebra</Option>
        </SelectTwo>
    );
}

export const withRichOptionContent = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo
            value={value}
            aria-label={value} 
            onChange={({ value: v }) => setValue(v)}
        >
            <Option value="reddit"><Icon name="reddit"/> Reddit</Option>
            <Option value="twitter"><Icon name="twitter"/> Twitter</Option>
            <Option value="yahoo"><Icon name="yahoo"/> Yahoo</Option>
            <Option value="youtube"><Icon name="youtube"/> Youtube</Option>
        </SelectTwo>
    );
}

export const withCustomSearchClearTimer = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo
            value={value}
            aria-label={value}
            onChange={({ value: v }) => setValue(v)}
            clearSearchAfter={1000}
        >
            <Option value="ant">Ant</Option>
            <Option value="bear">Bear</Option>
            <Option value="chimpanzee">Chimpanzee</Option>
            <Option value="deer">Deer</Option>
            <Option value="zebra">Zebra</Option>
        </SelectTwo>
    );
}

export const withComplexValues = () => {
    const [ value, setValue ] = useState<{ name: string } | null>(null);

    return (
        <SelectTwo
            value={value}
            aria-label={value?.name}
            onChange={({ value: v }) => setValue(v)}
        >
            <Option value={{ name: 'ant' }}>Ant</Option>
            <Option value={{ name: 'bear' }}>Bear</Option>
            <Option value={{ name: 'chimpanzee' }}>Chimpanzee</Option>
        </SelectTwo>
    );
}
