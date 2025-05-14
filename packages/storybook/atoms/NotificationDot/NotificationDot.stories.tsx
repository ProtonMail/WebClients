import type { Meta, StoryObj } from '@storybook/react';

import { Card, NotificationDot, type NotificationDotProps } from '@proton/atoms';
import { ThemeColor } from '@proton/colors/types';

const meta: Meta<typeof NotificationDot> = {
    args: {
        alt: 'dot',
        color: ThemeColor.Norm,
    },
    argTypes: {
        color: {
            control: 'radio',
            options: Object.values(ThemeColor),
        },
    },
    component: NotificationDot,
    parameters: {
        docs: {
            description: {
                component:
                    'The `NotificationDot` is a circle which can be colored. It takes no opinion on its positioning.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NotificationDot>;

export const Default: Story = {
    render: (args) => (
        <div className="flex">
            <NotificationDot {...args} />
        </div>
    ),
};

// Colors
const allColorsSorted = Object.values(ThemeColor).sort();
const allColorsWithProps = (props: NotificationDotProps) => (
    <div className="flex">
        {allColorsSorted.map((color: ThemeColor) => (
            <NotificationDot key={color} {...props} color={color} className="mr-4" />
        ))}
    </div>
);

export const AllColors: Story = {
    render: (args) => allColorsWithProps(args),
};

export const WithPositionHelper: Story = {
    parameters: {
        docs: {
            description: {
                // eslint-disable-next-line custom-rules/deprecate-classes
                story: 'A `notification-dot--top-right` css class to align the center of the dot to the top right of the container.',
            },
        },
    },
    render: (args) => (
        <>
            <Card className="relative mb-4">
                With helper
                <NotificationDot {...args} className="absolute top-0 right-0 notification-dot--top-right" />
            </Card>
            <Card className="relative">
                Without helper
                <NotificationDot {...args} className="absolute top-0 right-0" />
            </Card>
        </>
    ),
};
