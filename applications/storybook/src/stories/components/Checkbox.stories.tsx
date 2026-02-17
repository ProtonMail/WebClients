import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Checkbox from '@proton/components/components/input/Checkbox';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';

const meta: Meta<typeof Checkbox> = {
    title: 'Components/Checkbox',
    args: {
        id: 'checkbox',
        children: 'Checkbox label',
    },
    component: Checkbox,
    parameters: {
        docs: {
            description: {
                component:
                    'Checkboxes allow the user to select one or more items from a set. Supports loading, indeterminate, and custom color states.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = {
    args: {
        checked: true,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const DisabledChecked: Story = {
    args: {
        disabled: true,
        checked: true,
    },
};

export const Indeterminate: Story = {
    args: {
        indeterminate: true,
        children: "I'm indeterminate",
    },
};

export const Loading: Story = {
    render: () => {
        const [isChecked, setIsChecked] = useState(false);
        const [loading, withLoading] = useLoading(false);

        return (
            <Checkbox
                id="checkbox-loading"
                checked={isChecked}
                loading={loading}
                onChange={() => {
                    const run = async () => {
                        await wait(1000);
                        setIsChecked((old) => !old);
                    };
                    void withLoading(run());
                }}
            >
                Click me (loading state lasts 1s)
            </Checkbox>
        );
    },
};

export const CustomColors: Story = {
    args: {
        checked: true,
        backgroundColor: 'rgb(255, 50, 50)',
        borderColor: 'rgb(200, 80, 80)',
        color: 'rgb(255, 255, 255)',
        children: "I'm red",
    },
};

export const CustomGap: Story = {
    args: {
        gap: 'gap-4',
        children: 'Checkbox with a larger gap',
    },
};

export const LongContent: Story = {
    args: {
        children:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?',
    },
};

export const AsInputField: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);

        return <InputFieldTwo as={Checkbox} label="Checkbox" checked={checked} onChange={() => setChecked(!checked)} />;
    },
};
