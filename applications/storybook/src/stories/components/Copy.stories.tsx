import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Copy from '@proton/components/components/button/Copy';

const meta: Meta<typeof Copy> = {
    title: 'Components/Copy',
    args: {
        value: 'Copied text',
    },
    component: Copy,
    parameters: {
        docs: {
            description: {
                component:
                    'A button that copies a given value to the clipboard. Supports custom tooltip text, different shapes, and an onCopy callback.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Copy>;

export const Default: Story = {};

export const WithCustomTooltip: Story = {
    args: {
        tooltipText: 'Copy secret code',
        value: 'secret-code-123',
    },
};

export const GhostShape: Story = {
    args: {
        shape: 'ghost',
    },
};

export const SolidShape: Story = {
    args: {
        shape: 'solid',
    },
};

export const WithChildren: Story = {
    args: {
        children: 'Copy me',
        value: 'Custom text to copy',
    },
};
