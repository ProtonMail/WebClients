import type { Meta, StoryObj } from '@storybook/react';

import { UserAvatar, UserAvatarSizeEnum } from '..';

const meta: Meta<typeof UserAvatar> = {
    args: {
        as: 'span',
        capitalize: true,
        className: '',
        name: 'Proton',
        size: UserAvatarSizeEnum.Medium,
    },
    argTypes: {
        size: {
            control: 'radio',
            options: Object.values(UserAvatarSizeEnum),
        },
    },
    component: UserAvatar,
    parameters: {
        docs: {
            description: {
                component:
                    'UserAvatar is a component that displays a colored avatar with either the first letter or a greek later if no name is passed. The color is automatically generated based on the name, but can be customized using either HSL values or hue.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof UserAvatar>;

export const Default: Story = {};

export const AllSizes: Story = {
    render: (args) => (
        <>
            <div className="flex flex-col gap-8">
                {Object.values(UserAvatarSizeEnum)
                    .sort()
                    .map((size) => (
                        <UserAvatar key={size} {...args} size={size} />
                    ))}
            </div>
        </>
    ),
};

export const WithCustomHue: Story = {
    args: {
        color: { hue: 180 },
    },
};

export const WithCustomHSL: Story = {
    args: {
        color: { hsl: 'hsl(120, 100%, 50%)' },
    },
};
