import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { useLoading } from '@proton/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';

const meta: Meta<typeof Toggle> = {
    title: 'Components/Toggle',
    component: Toggle,
    parameters: {
        docs: {
            description: {
                component:
                    'A toggle switch input. Supports loading state with blocked interactions, disabled state, labels, and integration with InputFieldTwo.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
    render: () => {
        const [isChecked, setIsChecked] = useState(true);

        return <Toggle id="toggle-basic" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />;
    },
};

export const WithLabel: Story = {
    render: () => {
        const [isChecked, setIsChecked] = useState(true);

        return (
            <Toggle id="toggle-label" checked={isChecked} onChange={() => setIsChecked(!isChecked)}>
                This is a label
            </Toggle>
        );
    },
};

export const Loading: Story = {
    render: () => {
        const [isChecked, setIsChecked] = useState(false);
        const [loading, withLoading] = useLoading(false);

        return (
            <Toggle
                id="toggle-loading"
                checked={isChecked}
                loading={loading}
                onChange={() => {
                    const run = async () => {
                        await wait(500);
                        setIsChecked((old) => !old);
                    };
                    void withLoading(run());
                }}
            />
        );
    },
};

export const Disabled: Story = {
    render: () => (
        <>
            <Toggle id="toggle-disabled-unchecked" disabled className="mr-4" />
            <Toggle id="toggle-disabled-checked" checked disabled />
        </>
    ),
};

export const AsInputField: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);

        return <InputFieldTwo as={Toggle} label="Toggle" checked={checked} onChange={() => setChecked(!checked)} />;
    },
};
