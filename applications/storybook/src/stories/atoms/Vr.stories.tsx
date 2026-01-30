import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Vr } from '@proton/atoms/Vr/Vr';

const meta: Meta<typeof Vr> = {
    title: 'Atoms/Vr',
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
