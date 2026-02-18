import type { Meta, StoryObj } from '@storybook/react-webpack5';

const loremIpsum =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const meta: Meta = {
    title: 'CSS Utilities/Scroll',
    parameters: {
        docs: {
            description: {
                component:
                    'Overflow and scroll utility classes. Control how content overflows its container with overflow-auto, overflow-x-auto, and overflow-hidden.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Overflow: Story = {
    render: () => (
        <div className="overflow-auto bg-weak p-7" style={{ height: '100px' }}>
            <p className="m-0" style={{ minWidth: '130%' }}>
                {loremIpsum} {loremIpsum} {loremIpsum}
            </p>
        </div>
    ),
};

export const OverflowHorizontal: Story = {
    render: () => (
        <div className="overflow-x-auto bg-weak p-7" style={{ height: '100px' }}>
            <p className="m-0">
                {loremIpsum} {loremIpsum} {loremIpsum}
            </p>
        </div>
    ),
};

export const OverflowHidden: Story = {
    render: () => (
        <div className="overflow-hidden bg-weak p-7" style={{ height: '100px' }}>
            <p className="m-0">
                {loremIpsum} {loremIpsum} {loremIpsum}
            </p>
        </div>
    ),
};
