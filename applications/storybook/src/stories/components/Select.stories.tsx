import { useMemo, useRef, useState } from 'react';

import { Icon, InputFieldTwo, LabelStack, Option, SearchableSelect, SelectTwo } from '@proton/components';

import mdx from './Select.mdx';

export default {
    title: 'Components/Select',
    component: SelectTwo,
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Playground = ({ ...args }) => {
    const [value, setValue] = useState('ant');

    return (
        <SelectTwo {...args} value={value} onChange={({ value: v }) => setValue(v)}>
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
};
Playground.args = {};

export const Basic = () => {
    const [value, setValue] = useState('ant');

    return (
        <SelectTwo value={value} onValue={setValue}>
            <Option title="Ant" value="ant" />
            <Option title="Zebra" value="zebra" />
        </SelectTwo>
    );
};

export const Multiple = () => {
    const options = useMemo(() => [{ label: 'ant' }, { label: 'zebra' }], []);
    const [value, setValue] = useState([options[0]]);

    return (
        <SelectTwo value={value} onValue={setValue} multiple>
            {options.map((option) => (
                <Option title={option.label} value={option} key={option.label} />
            ))}
        </SelectTwo>
    );
};

export const Search = () => {
    const options = ['France', 'Switzerland', 'Taïwan', 'USA', 'UK'];
    const [value, setValue] = useState('France');

    return (
        <SearchableSelect
            title={'Choose your country'}
            value={value}
            onChange={(e) => setValue(e.value)}
            search
            searchPlaceholder={'Search for country'}
        >
            {options.map((option) => (
                <Option key={option} value={option} title={option} />
            ))}
        </SearchableSelect>
    );
};

export const MultiSearch = () => {
    const options = ['France', 'Switzerland', 'Taïwan', 'USA', 'UK'];
    const [value, setValue] = useState([]);

    return (
        <SearchableSelect
            multiple
            value={value}
            onChange={(e) => setValue(e.value)}
            search
            searchPlaceholder={'Search for country'}
            placeholder={'Choose your country'}
        >
            {options.map((option) => (
                <Option key={option} value={option} title={option} />
            ))}
        </SearchableSelect>
    );
};

const options = [
    { color: '#8080FF', name: 'electron' },
    { color: '#EC3E7C', name: 'muon' },
    { color: '#DB60D6', name: 'tau' },
    { color: '#415DF0', name: 'neutrino' },
    { color: '#179FD9', name: 'z boson' },
    { color: '#1DA583', name: 'w boson' },
    { color: '#3CBB3A', name: 'quark' },
    { color: '#B4A40E', name: 'higgs' },
    { color: '#936D58', name: 'photon' },
    { color: '#F78400', name: 'gluon' },
];

export const RenderSelected = () => {
    const [value, setValue] = useState<typeof options>(options.slice(0, 4));

    return (
        <SelectTwo
            multiple
            value={value}
            placeholder={'Choose your country'}
            onValue={setValue}
            renderSelected={(selected) => <LabelStack labels={selected ?? []} />}
        >
            {options.map((option) => (
                <Option key={option.name} value={option} title={option.name} />
            ))}
        </SelectTwo>
    );
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
                <Option title={option.name} value={option} key={option.name} />
            ))}
        </SelectTwo>
    );
};

export const AsInputField = () => {
    return (
        <InputFieldTwo as={SelectTwo} label="Select" placeholder="Placeholder">
            <Option title="one" value="one" />
            <Option title="two" value="two" />
            <Option title="three" value="three" />
        </InputFieldTwo>
    );
};
