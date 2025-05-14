import type { Meta, StoryObj } from '@storybook/react';

import { NotificationCounter, type NotificationCounterProps } from '@proton/atoms';
import { ThemeColor } from '@proton/colors/types';

const meta: Meta<typeof NotificationCounter> = {
    args: {
        alt: 'seven',
        color: ThemeColor.Norm,
        count: 7,
    },
    argTypes: {
        color: {
            control: 'radio',
            options: Object.values(ThemeColor),
        },
    },
    component: NotificationCounter,
    parameters: {
        docs: {
            description: {
                component: 'NotificationCounter component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NotificationCounter>;

export const Default: Story = {};

// Colors
const allColorsSorted = Object.values(ThemeColor).sort();
const allColorsWithProps = (props: NotificationCounterProps) => (
    <ul style={{ listStyle: 'none', display: 'flex', gap: '2em' }}>
        {allColorsSorted.map((color: ThemeColor) => (
            <li key={color}>
                <NotificationCounter key={color} {...props} color={color} />
            </li>
        ))}
    </ul>
);

export const AllColors: Story = {
    render: (args) => allColorsWithProps(args),
};
