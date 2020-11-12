import React, { useState } from 'react';
import { SelectTwo, Option, Icon } from 'react-components';

export default {
    component: SelectTwo,
    title: 'Proton UI / Select'
};

export const Basic = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="ant" value="ant">Ant</Option>
            <Option title="zebra" value="zebra">Zebra</Option>
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
            isOpen={open}
            value={value}
            onChange={({ value: v }) => setValue(v)}
            onOpen={handleOpen}
            onClose={handleClose}
        >
            <Option title="ant" value="ant">Ant</Option>
            <Option title="zebra" value="zebra">Zebra</Option>
        </SelectTwo>
    );
}

export const withRichOptionContent = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="reddit" value="reddit"><Icon name="reddit"/> Reddit</Option>
            <Option title="twitter" value="twitter"><Icon name="twitter"/> Twitter</Option>
            <Option title="yahoo" value="yahoo"><Icon name="yahoo"/> Yahoo</Option>
            <Option title="youtube" value="youtube"><Icon name="youtube"/> Youtube</Option>
        </SelectTwo>
    );
}

export const withCustomSearchClearTimer = () => {
    const [ value, setValue ] = useState('');

    return (
        <SelectTwo
            value={value}
            onChange={({ value: v }) => setValue(v)}
            clearSearchAfter={1000}
        >
            <Option title="ant" value="ant">Ant</Option>
            <Option title="bear" value="bear">Bear</Option>
            <Option title="chimpanzee" value="chimpanzee">Chimpanzee</Option>
            <Option title="deer" value="deer">Deer</Option>
            <Option title="zebra" value="zebra">Zebra</Option>
        </SelectTwo>
    );
}

export const withComplexValues = () => {
    const [ value, setValue ] = useState<{ name: string } | null>(null);

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="ant" value={{ name: 'ant' }}>Ant</Option>
            <Option title="bear" value={{ name: 'bear' }}>Bear</Option>
            <Option title="chimpanzee" value={{ name: 'chimpanzee' }}>Chimpanzee</Option>
        </SelectTwo>
    );
}
