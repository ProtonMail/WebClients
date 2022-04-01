import { useRef, useState } from 'react';
import { SelectTwo, Option, Icon } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Select.mdx';

export default {
    title: getTitle(__filename, false),
    component: SelectTwo,
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }) => {
    const [value, setValue] = useState('ant');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)} {...args}>
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
};

Basic.args = {
    placeholder: 'Animal',
    clearSearchAfter: 500,
};

export const ControlledOpenState = () => {
    const [value, setValue] = useState('');

    const [open, setOpen] = useState(false);

    function handleOpen() {
        setOpen(true);
    }

    function handleClose() {
        setOpen(false);
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
};

export const WithRichOptionContent = () => {
    const [value, setValue] = useState('android');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="android" value="android">
                <Icon name="brand-android" /> android
            </Option>
            <Option title="apple" value="apple">
                <Icon name="brand-apple" /> apple
            </Option>
            <Option title="linux" value="linux">
                <Icon name="brand-linux" /> linux
            </Option>
            <Option title="chrome" value="chrome">
                <Icon name="brand-chrome" /> chrome
            </Option>
        </SelectTwo>
    );
};

export const WithCustomSearchClearTimer = () => {
    const [value, setValue] = useState('ant');

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)} clearSearchAfter={1000}>
            <Option title="Ant" value="ant" />
            <Option title="Bear" value="bear" />
            <Option title="Chimpanzee" value="chimpanzee" />
            <Option title="Deer" value="deer" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
};

export const WithComplexValues = () => {
    /*
     * The useRef is used here in order to preserve identity of the value to its
     * option between render cycles since the Select uses identity comparison to
     * determine which option is selected.
     */
    const { current: options } = useRef([{ name: 'ant' }, { name: 'bear' }, { name: 'chimpanzee' }]);

    const [value, setValue] = useState<{ name: string } | null>(options[0]);

    return (
        <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
            {options.map((option) => (
                <Option title={option.name} value={option} />
            ))}
        </SelectTwo>
    );
};
