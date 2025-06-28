import type { Meta, StoryObj } from '@storybook/react';

import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
    args: {
        shortcut: 'N',
    },
    component: Kbd,
    parameters: {
        docs: {
            description: {
                component:
                    'The `Kbd` component is used to display keyboard shortcuts and provides the correct aria-label for screen readers.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Kbd>;

export const Default: Story = {};
