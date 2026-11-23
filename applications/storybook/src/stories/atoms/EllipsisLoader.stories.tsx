import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { EllipsisLoader } from '@proton/atoms/EllipsisLoader/EllipsisLoader';

const meta: Meta<typeof EllipsisLoader> = {
    title: 'Atoms/Ellipsis Loader',
    component: EllipsisLoader,
    parameters: {
        docs: {
            description: {
                component: 'An animated ellipsis indicator used to show that content is loading.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof EllipsisLoader>;

export const Default: Story = {};
