import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Lists',
    parameters: {
        docs: {
            description: {
                component: 'List styling utilities. Use the unstyled class to remove default list markers and padding.',
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
            <div className="flex gap-7">
                <div>
                    <ul className="m-0">
                        <li>Normal</li>
                        <li>list</li>
                    </ul>
                </div>
                <div>
                    <ul className="unstyled m-0">
                        <li>unstyled</li>
                        <li>list</li>
                    </ul>
                </div>
            </div>
        </div>
    ),
};
