import type { Meta, StoryObj } from '@storybook/react';

import { Pill } from './Pill';

const meta: Meta<typeof Pill> = {
    args: {
        backgroundColor: '',
        children: 'I am a pill',
        color: '',
    },
    component: Pill,
    parameters: {
        docs: {
            description: {
                component:
                    'This is a generic Pill component which accepts a `color` and a `backgroundColor`. If one of the colors is given, the other color will be generated automatically. If both colors are given, they will be used as they are. If no color is set, the default color is used.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Pill>;

export const Default: Story = {};
export const WithColor: Story = {
    args: {
        color: '#b90404',
    },
};
export const WithBackgroundColor: Story = {
    args: {
        backgroundColor: '#fff2b3',
    },
};
export const WithColorAndBackgroundColor: Story = {
    args: {
        color: '#b90404',
        backgroundColor: '#fff2b3',
    },
};
