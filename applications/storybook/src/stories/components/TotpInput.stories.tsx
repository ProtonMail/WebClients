import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Toggle from '@proton/components/components/toggle/Toggle';
import TotpInput from '@proton/components/components/v2/input/TotpInput';

const meta: Meta<typeof TotpInput> = {
    title: 'Components/Totp Input',
    component: TotpInput,
    parameters: {
        docs: {
            description: {
                component:
                    'A one-time code input with individual character cells. Supports numeric and alphabetic types, configurable length, center divider, and auto-focus.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TotpInput>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState('');

        return <TotpInput value={value} length={6} onValue={setValue} type="number" />;
    },
};

export const CustomLength: Story = {
    render: () => {
        const [value, setValue] = useState('1a2b');
        const [centerDivider, setCenterDivider] = useState(true);

        return (
            <div>
                <div className="mb-4">
                    <div className="flex justify-center">
                        <div className="w-2/3">
                            <TotpInput
                                value={value}
                                length={4}
                                onValue={setValue}
                                type="alphabet"
                                centerDivider={centerDivider}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Toggle
                        id="center-divider"
                        checked={centerDivider}
                        onChange={(e) => setCenterDivider(e.target.checked)}
                    />
                    <label htmlFor="center-divider" className="flex-1 text-sm">
                        Enable center divider
                    </label>
                </div>
            </div>
        );
    },
};

export const SwitchableType: Story = {
    render: () => {
        const [value, setValue] = useState('');
        const [type, setType] = useState<'number' | 'alphabet'>('alphabet');

        return (
            <>
                <TotpInput value={value} length={type === 'alphabet' ? 8 : 6} onValue={setValue} type={type} />
                <InlineLinkButton className="mt-4" onClick={() => setType(type === 'alphabet' ? 'number' : 'alphabet')}>
                    {type === 'alphabet' ? 'Use type `number`' : 'Use type `alphabet`'}
                </InlineLinkButton>
            </>
        );
    },
};
