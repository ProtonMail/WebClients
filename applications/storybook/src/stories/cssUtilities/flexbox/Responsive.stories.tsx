import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Flexbox/Responsive',
    parameters: {
        docs: {
            description: {
                component:
                    'All flex helper classes can be prefixed with `sm:`, `md:`, `lg:` or `xl:` for responsive behavior.',
            },
        },
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const ColumnMobile: Story = {
    render: () => (
        <div className="flex gap-2 justify-space-between flex-column md:flex-row rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ColumnTablet: Story = {
    render: () => (
        <div className="flex gap-2 justify-space-between flex-column lg:flex-row rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const FlexGap0: Story = {
    render: () => (
        <div className="flex gap-0 md:gap-4 rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};
