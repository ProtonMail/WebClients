import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Radio from '@proton/components/components/input/Radio';
import RadioGroup from '@proton/components/components/input/RadioGroup';

const weather = ['Snow', 'Sunshine', 'Rain'] as const;

const meta: Meta<typeof Radio> = {
    title: 'Components/Radio',
    component: Radio,
    parameters: {
        docs: {
            description: {
                component:
                    'A radio input component for single-selection from a set of options. Use RadioGroup to render a list of radio options with built-in state management.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Radio>;

export const Default: Story = {
    render: () => {
        const [selected, setSelected] = useState<(typeof weather)[number] | undefined>(undefined);

        return (
            <RadioGroup
                name="selected-weather"
                onChange={(v) => setSelected(v)}
                value={selected}
                options={weather.map((option) => ({ value: option, label: option }))}
            />
        );
    },
};

export const SingleRadio: Story = {
    render: () => {
        const [checked, setChecked] = useState(true);

        return (
            <Radio id="single-radio" name="single" checked={checked} onChange={() => setChecked(!checked)}>
                Single radio option
            </Radio>
        );
    },
};

export const Disabled: Story = {
    render: () => (
        <RadioGroup
            name="disabled-weather"
            onChange={() => {}}
            value="Snow"
            options={weather.map((option) => ({ value: option, label: option, disabled: true }))}
        />
    ),
};

export const WithDisabledOption: Story = {
    render: () => {
        const [selected, setSelected] = useState<(typeof weather)[number] | undefined>(undefined);

        return (
            <RadioGroup
                name="partial-disabled"
                onChange={(v) => setSelected(v)}
                value={selected}
                options={weather.map((option) => ({
                    value: option,
                    label: option,
                    disabled: option === 'Rain',
                }))}
            />
        );
    },
};
