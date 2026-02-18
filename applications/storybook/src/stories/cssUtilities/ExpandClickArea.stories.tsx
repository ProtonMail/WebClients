import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Checkbox from '@proton/components/components/input/Checkbox';

const meta: Meta = {
    title: 'CSS Utilities/Expand Click Area',
    parameters: {
        docs: {
            description: {
                component:
                    "The expand-click-area utility expands an element's clickable area to fill its nearest positioned parent.",
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
    render: () => (
        <div className="relative p-7 bg-weak">
            <Checkbox className="expand-click-area mr-2" />
            parent element (grey background)
        </div>
    ),
};
