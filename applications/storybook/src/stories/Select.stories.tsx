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
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
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
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
}

export const withRichOptionContent = () => {
    const [ value, setValue ] = useState('');

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
    const [ value, setValue ] = useState('');

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
    const [ value, setValue ] = useState<{ name: string } | null>(null);

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="Ant" value={{ name: 'ant' }} />
            <Option title="Bear" value={{ name: 'bear' }} />
            <Option title="Chimpanzee" value={{ name: 'chimpanzee' }} />
        </SelectTwo>
    );
}
