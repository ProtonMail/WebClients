import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Columns',
    parameters: {
        docs: {
            description: {
                component: 'CSS column layout utilities. Supports responsive column counts with breakpoint prefixes.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
    render: () => (
        <div className="w-1/2 self-center">
            <ul className="columns-1 md:columns-2">
                <li>This is</li>
                <li>just</li>
                <li>one</li>
                <li>list</li>
                <li>believe</li>
                <li>me</li>
            </ul>
        </div>
    ),
};
