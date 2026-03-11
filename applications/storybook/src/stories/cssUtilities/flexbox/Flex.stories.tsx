import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Flexbox/Flex',
    parameters: {
        docs: {
            description: {
                component:
                    'Defines a flex container and enables a flex context for all its direct children. The `flex` class is mandatory when using any of the flex helper classes. Note: the `flex` class applies `min-width: 0` and `min-height: 0` to direct children.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Flex: Story = {
    render: () => (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const InlineFlex: Story = {
    render: () => (
        <div className="inline-flex rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};
