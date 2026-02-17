import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';

const longText =
    'mySuperLoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooongFile.jpg';

const meta: Meta<typeof MiddleEllipsis> = {
    title: 'Components/Middle Ellipsis',
    args: {
        text: longText,
    },
    component: MiddleEllipsis,
    parameters: {
        docs: {
            description: {
                component:
                    'Truncates text in the middle rather than at the end, preserving both the beginning and end of the string. Useful for filenames and long paths.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MiddleEllipsis>;

export const Default: Story = {};

export const WithoutTitle: Story = {
    args: {
        displayTitle: false,
    },
};

export const ConstrainedWidth: Story = {
    args: {
        className: 'w-1/2',
    },
};

export const CustomEndChars: Story = {
    args: {
        charsToDisplayEnd: 10,
    },
};
