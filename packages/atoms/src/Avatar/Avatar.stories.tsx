import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
    argTypes: {
        color: {
            control: 'radio',
            options: ['norm', 'weak'],
        },
    },
    args: {
        color: 'norm',
        children: 'PM',
    },
    component: Avatar,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to highlight user initials.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {};

export const Weak: Story = {
    args: {
        color: 'weak',
    },
};
