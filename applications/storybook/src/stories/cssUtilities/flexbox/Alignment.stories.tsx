import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Flexbox/Alignment',
    parameters: {
        docs: {
            description: {
                component:
                    'Alignment utilities for flexbox: `justify-*` for main-axis alignment, `items-*` for cross-axis alignment, and `self-*` for individual item alignment. Also includes `content-*` helpers for `align-content`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const JustifyStart: Story = {
    render: () => (
        <div className="flex justify-start rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const JustifyCenter: Story = {
    render: () => (
        <div className="flex justify-center rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const JustifyEnd: Story = {
    render: () => (
        <div className="flex justify-end rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const JustifyBetween: Story = {
    render: () => (
        <div className="flex justify-space-between rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const JustifyAround: Story = {
    render: () => (
        <div className="flex justify-space-around rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const JustifyEvenly: Story = {
    render: () => (
        <div className="flex justify-space-evenly rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsStartColumn: Story = {
    render: () => (
        <div className="flex flex-column items-start rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsCenterColumn: Story = {
    render: () => (
        <div className="flex flex-column items-center rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsEndColumn: Story = {
    render: () => (
        <div className="flex flex-column items-end rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsStart: Story = {
    render: () => (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="bg-primary p-2">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsEnd: Story = {
    render: () => (
        <div className="flex items-end rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="bg-primary p-2">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const ItemsCenter: Story = {
    render: () => (
        <div className="flex items-center rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    ),
};

export const ItemsBaseline: Story = {
    render: () => (
        <div className="flex items-baseline rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    ),
};

export const ItemsStretch: Story = {
    render: () => (
        <div className="flex items-stretch rounded overflow-hidden border">
            <div className="bg-primary p-2">div</div>
            <span className="bg-primary p-4 text-2xl">span</span>
            <em className="bg-primary p-4 text-2xs">em</em>
        </div>
    ),
};

export const SelfCenter: Story = {
    render: () => (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-center bg-info p-2">Only this is centered</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const SelfStart: Story = {
    render: () => (
        <div className="flex items-end rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-start bg-info p-2">This is aligned to the top</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const SelfEnd: Story = {
    render: () => (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-end bg-info p-2">This is aligned to the end</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const SelfStretch: Story = {
    render: () => (
        <div className="flex items-start rounded overflow-hidden border">
            <div className="bg-primary p-8">div</div>
            <span className="self-stretch bg-info p-2">This is stretched</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const VerticallyCenterOneItem: Story = {
    render: () => (
        <div className="flex rounded overflow-hidden border">
            <div className="m-auto bg-info p-4">I'm a div with class "m-auto"</div>
        </div>
    ),
};
