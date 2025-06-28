import type { Meta, StoryObj } from '@storybook/react';

import { Vr } from './Vr';

const meta: Meta<typeof Vr> = {
    args: {
        className: '',
    },
    component: Vr,
    parameters: {
        docs: {
            description: {
                component: 'This component is simply a vertical separator styled using the class `vr`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Vr>;

export const Default: Story = {};
