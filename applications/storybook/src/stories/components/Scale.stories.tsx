import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import EmojiScale from '@proton/components/components/input/EmojiScale';
import Scale from '@proton/components/components/input/Scale';

const meta: Meta<typeof Scale> = {
    title: 'Components/Scale',
    component: Scale,
    parameters: {
        docs: {
            description: {
                component:
                    'A numeric scale input for rating or scoring. Renders a row of selectable buttons from a range. Also available as EmojiScale with emoji icons.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Scale>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState<number>();

        return (
            <Scale
                from={0}
                to={10}
                fromLabel="0 - Not at all likely"
                toLabel="10 - Extremely likely"
                value={value}
                onChange={setValue}
            />
        );
    },
};

export const Emoji: Story = {
    render: () => {
        const [value, setValue] = useState<number>();

        return <EmojiScale fromLabel="Awful" toLabel="Wonderful" value={value} onChange={setValue} />;
    },
};
