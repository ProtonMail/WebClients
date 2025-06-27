import type { Meta, StoryObj } from '@storybook/react';

import { ProtonLoader, ProtonLoaderType } from './ProtonLoader';

const meta: Meta<typeof ProtonLoader> = {
    args: {
        type: ProtonLoaderType.Default,
    },
    argTypes: {
        type: {
            control: 'radio',
            options: Object.values(ProtonLoaderType),
        },
    },
    component: ProtonLoader,
    parameters: {
        docs: {
            description: {
                component:
                    'The `ProtonLoader` should be used to indicate that the page is loading.<br /> The loader color can be changed using the type prop. Negative can be used for dark backgrounds.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProtonLoader>;

export const Default: Story = {};

export const Negative: Story = {
    args: {
        type: ProtonLoaderType.Negative,
    },
    render: (args) => (
        <div className="ui-prominent bg-norm p-4">
            <ProtonLoader {...args} />
        </div>
    ),
};
