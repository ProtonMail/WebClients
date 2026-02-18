import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';

const meta: Meta = {
    title: 'CSS Utilities/Opacity On Hover',
    parameters: {
        docs: {
            description: {
                component:
                    'Group hover opacity utilities. Elements with group-hover:opacity-100 become visible when hovering the group container. Use group-hover:opacity-100-no-width to also collapse width when hidden.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
    render: () => (
        <div className="group-hover-opacity-container">
            hover or focus me, pikaaaaa…
            <Button className="ml-4 group-hover:opacity-100">CHU</Button>
        </div>
    ),
};

export const NoWidth: Story = {
    render: () => (
        <div className="group-hover-opacity-container">
            This is the group container, hover me
            <Button className="ml-4 group-hover:opacity-100 group-hover:opacity-100-no-width">Hidden Button</Button>
            <Button type="button" className="ml-4">
                Button
            </Button>
        </div>
    ),
};
