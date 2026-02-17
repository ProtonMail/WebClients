import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Progress from '@proton/components/components/progress/Progress';

const meta: Meta<typeof Progress> = {
    title: 'Components/Progress',
    args: {
        value: 50,
        max: 100,
    },
    component: Progress,
    parameters: {
        docs: {
            description: {
                component:
                    'A progress bar component that visually represents completion of a task. Supports custom max values and CSS class-based color variants (warning, error).',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Warning: Story = {
    args: {
        value: 40,
        className: 'progress-bar--warning',
    },
};

export const Error: Story = {
    args: {
        value: 80,
        className: 'progress-bar--error',
    },
};
