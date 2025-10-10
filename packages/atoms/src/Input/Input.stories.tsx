import type { Meta, StoryObj } from '@storybook/react';

import Icon from '@proton/components/components/icon/Icon';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
    args: {
        placeholder: 'Placeholder',
    },
    component: Input,
    parameters: {
        docs: {
            description: {
                component: 'CircleLoader component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const Unstyled: Story = {
    args: {
        unstyled: true,
    },
};

export const WithError: Story = {
    args: {
        error: true,
    },
};

export const WithPrefix: Story = {
    args: {
        prefix: <Icon name="magnifier" />,
    },
};
export const WithSuffix: Story = {
    args: {
        suffix: '@protonmail.com',
    },
};
