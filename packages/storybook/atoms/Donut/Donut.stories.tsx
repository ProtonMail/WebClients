import type { Meta, StoryObj } from '@storybook/react';

import { Donut } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';

const meta: Meta<typeof Donut> = {
    args: {
        backgroundSegmentColor: 'var(--background-weak)',
        gap: 4,
        segments: [
            [20, ThemeColor.Danger],
            [10, ThemeColor.Warning],
            [15, ThemeColor.Success],
            [10, ThemeColor.Norm],
            [15, ThemeColor.Weak],
        ],
    },
    component: Donut,
    parameters: {
        docs: {
            description: {
                component: `Donut component.`,
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Donut>;

export const Default: Story = {
    render: (props) => (
        <div style={{ width: 200, height: 200 }}>
            <Donut {...props} />
        </div>
    ),
};
