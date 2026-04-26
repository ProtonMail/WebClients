import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Input } from '@proton/atoms/Input/Input';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

const meta: Meta<typeof Input> = {
    title: 'Atoms/Input',
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
        prefix: <IcMagnifier />,
    },
};
export const WithSuffix: Story = {
    args: {
        suffix: '@protonmail.com',
    },
};
