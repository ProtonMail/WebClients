import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Flexbox/Sizing',
    parameters: {
        docs: {
            description: {
                component:
                    'Item sizing utilities for flexbox: `.flex-1`, `.flex-auto`, `.flex-none` for shorthand sizing, and `.grow-*` / `.shrink-*` for individual grow/shrink control. Resize containers to see the effect.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Flex1: Story = {
    render: () => (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-1 bg-info p-4">.flex-1</em>
        </div>
    ),
};

export const FlexAuto: Story = {
    render: () => (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-auto bg-info p-4">.flex-auto</em>
        </div>
    ),
};

export const Grow: Story = {
    render: () => (
        <div className="flex rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-2 bg-info p-4">.grow-2</em>
        </div>
    ),
};

export const Shrink0: Story = {
    render: () => (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="shrink-0 bg-info p-4">.shrink-0</em>
        </div>
    ),
};

export const Grow0: Story = {
    render: () => (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-0 bg-info p-4">.grow-0</em>
        </div>
    ),
};

export const Grow0Shrink0: Story = {
    render: () => (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="grow-0 shrink-0 bg-info p-4">static width</em>
        </div>
    ),
};

export const FlexNone: Story = {
    render: () => (
        <div className="flex flex-nowrap rounded overflow-hidden border">
            <div className="bg-primary p-4 w-custom" style={{ '--w-custom': '9.375rem' }}>
                150px wide
            </div>
            <span className="bg-primary p-4 w-1/4">25% wide</span>
            <em className="flex-none bg-info p-4">.flex-none</em>
        </div>
    ),
};
