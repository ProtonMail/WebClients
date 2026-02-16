import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Alert from '@proton/components/components/alert/Alert';

const meta: Meta<typeof Alert> = {
    title: 'Components/Alert',
    argTypes: {
        type: {
            control: 'select',
            options: ['info', 'error', 'warning', 'success'],
        },
    },
    args: {
        children: 'This is an alert',
    },
    component: Alert,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display different types of alerts.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const Error: Story = {
    args: {
        type: 'error',
    },
};

export const Warning: Story = {
    args: {
        type: 'warning',
    },
};

export const Success: Story = {
    args: {
        type: 'success',
    },
};
