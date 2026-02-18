import { useMemo, useRef, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Icon from '@proton/components/components/icon/Icon';
import LabelStack from '@proton/components/components/labelStack/LabelStack';
import Option from '@proton/components/components/option/Option';
import SearchableSelect from '@proton/components/components/selectTwo/SearchableSelect';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

const meta: Meta<typeof SelectTwo> = {
    title: 'Components/Select',
    component: SelectTwo,
    parameters: {
        docs: {
            description: {
                component:
                    'A custom select dropdown component. Supports single and multiple selection, searchable options, rich option content, controlled open state, and integration with InputFieldTwo.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SelectTwo>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState('ant');

        return (
            <SelectTwo value={value} onValue={setValue}>
                <Option title="Ant" value="ant" />
                <Option title="Zebra" value="zebra" />
            </SelectTwo>
        );
    },
};

export const Multiple: Story = {
    render: () => {
        const options = useMemo(() => [{ label: 'ant' }, { label: 'zebra' }], []);
        const [value, setValue] = useState([options[0]]);

        return (
            <SelectTwo value={value} onValue={setValue} multiple>
                {options.map((option) => (
                    <Option title={option.label} value={option} key={option.label} />
                ))}
            </SelectTwo>
        );
    },
};

export const Searchable: Story = {
    render: () => {
        const options = ['France', 'Switzerland', 'Taiwan', 'USA', 'UK'];
        const [value, setValue] = useState('France');

        return (
            <SearchableSelect
                title="Choose your country"
                value={value}
                onChange={(e) => setValue(e.value)}
                search
                searchPlaceholder="Search for country"
            >
                {options.map((option) => (
                    <Option key={option} value={option} title={option} />
                ))}
            </SearchableSelect>
        );
    },
};

export const MultiSearchable: Story = {
    render: () => {
        const options = ['France', 'Switzerland', 'Taiwan', 'USA', 'UK'];
        const [value, setValue] = useState([]);

        return (
            <SearchableSelect
                multiple
                value={value}
                onChange={(e) => setValue(e.value)}
                search
                searchPlaceholder="Search for country"
                placeholder="Choose your country"
            >
                {options.map((option) => (
                    <Option key={option} value={option} title={option} />
                ))}
            </SearchableSelect>
        );
    },
};

const colorOptions = [
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

export const RenderSelected: Story = {
    render: () => {
        const [value, setValue] = useState<typeof colorOptions>(colorOptions.slice(0, 4));

        return (
            <SelectTwo
                multiple
                value={value}
                placeholder="Choose your particle"
                onValue={setValue}
                renderSelected={(selected) => <LabelStack labels={selected ?? []} />}
            >
                {colorOptions.map((option) => (
                    <Option key={option.name} value={option} title={option.name} />
                ))}
            </SelectTwo>
        );
    },
};

export const ControlledOpenState: Story = {
    render: () => {
        const [value, setValue] = useState('');
        const [open, setOpen] = useState(false);

        return (
            <SelectTwo
                isOpen={open}
                value={value}
                onChange={({ value: v }) => setValue(v)}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <Option title="Ant" value="ant" />
                <Option title="Zebra" value="zebra" />
            </SelectTwo>
        );
    },
};

export const WithRichOptionContent: Story = {
    render: () => {
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
    },
};

export const CustomSearchClearTimer: Story = {
    render: () => {
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
    },
};

export const WithComplexValues: Story = {
    render: () => {
        const { current: options } = useRef([{ name: 'ant' }, { name: 'bear' }, { name: 'chimpanzee' }]);
        const [value, setValue] = useState<{ name: string } | null>(options[0]);

        return (
            <SelectTwo value={value} onChange={({ value: v }) => setValue(v)}>
                {options.map((option) => (
                    <Option title={option.name} value={option} key={option.name} />
                ))}
            </SelectTwo>
        );
    },
};

export const AsInputField: Story = {
    render: () => (
        <InputFieldTwo as={SelectTwo} label="Select" placeholder="Placeholder">
            <Option title="one" value="one" />
            <Option title="two" value="two" />
            <Option title="three" value="three" />
        </InputFieldTwo>
    ),
};
