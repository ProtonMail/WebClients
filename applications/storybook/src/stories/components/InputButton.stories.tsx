import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InputButton from '@proton/components/components/input/InputButton';
import remove from '@proton/utils/remove';

const meta: Meta<typeof InputButton> = {
    title: 'Components/Input Button',
    component: InputButton,
    parameters: {
        docs: {
            description: {
                component:
                    'InputButton provides checkbox or radio functionality represented as a circular button. Supports both single-select (radio) and multi-select (checkbox) modes.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InputButton>;

export const Default: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);

        return (
            <InputButton
                id="checkbox"
                title="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
            >
                A
            </InputButton>
        );
    },
};

export const Multiple: Story = {
    render: () => {
        const [checkedIds, setCheckedIds] = useState<string[]>([]);

        const handleChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
                setCheckedIds([...checkedIds, id]);
            } else {
                setCheckedIds(remove(checkedIds, id));
            }
        };

        return (
            <div>
                {['1', '2', '3', '4', '5'].map((n) => (
                    <InputButton
                        key={n}
                        id={n}
                        title="checkbox"
                        checked={checkedIds.includes(n)}
                        onChange={handleChange(n)}
                        labelProps={{ className: 'mr-4' }}
                    >
                        {n}
                    </InputButton>
                ))}
            </div>
        );
    },
};

export const RadioExclusive: Story = {
    render: () => {
        const [checkedId, setCheckedId] = useState<null | string>(null);

        return (
            <div>
                {['1', '2', '3', '4', '5'].map((n) => (
                    <InputButton
                        key={n}
                        id={`radio-${n}`}
                        title="radio"
                        type="radio"
                        value={n}
                        checked={n === checkedId}
                        onChange={(e) => setCheckedId(e.target.value)}
                        labelProps={{ className: 'mr-4' }}
                    >
                        {n}
                    </InputButton>
                ))}
            </div>
        );
    },
};
