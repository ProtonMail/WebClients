import type { Meta, StoryObj } from '@storybook/react';

import { UserAvatar, type UserAvatarProps, UserAvatarSizeEnum } from './UserAvatar';
import UserAvatarDocs from './UserAvatar.mdx';

type DefaultUserAvatarProps = UserAvatarProps<'span'>;

const meta: Meta<DefaultUserAvatarProps> = {
    title: 'Components/UserAvatar',
    component: UserAvatar,
    parameters: {
        docs: {
            page: UserAvatarDocs,
        },
    },
    argTypes: {
        name: {
            control: 'text',
            description: 'Name to display in the avatar, empty will show random greek letter',
            table: {
                type: { summary: 'string' },
                defaultValue: { summary: '' },
            },
        },
        color: {
            control: 'object',
            description: 'Custom color configuration using hue value (0-360) or HSL string',
            table: {
                type: { summary: '{ hue: number } | { hsl: string }' },
            },
        },
        size: {
            control: 'radio',
            options: Object.values(UserAvatarSizeEnum),
            description: 'Size of the avatar',
            table: {
                type: { summary: 'small | medium' },
                defaultValue: { summary: 'medium' },
            },
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
        },
        as: {
            control: 'text',
            description: 'Custom element type',
        },
        capitalize: {
            type: 'boolean',
            description: 'Whether to capitalize the letter',
            table: {
                defaultValue: {
                    summary: 'true',
                },
            },
        },
    },
};

export default meta;

type Story = StoryObj<DefaultUserAvatarProps>;

export const Default: Story = {
    args: {
        name: 'John Doe',
        size: UserAvatarSizeEnum.Medium,
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <UserAvatar name="John" size={UserAvatarSizeEnum.Small} />
            <UserAvatar name="Jane" size={UserAvatarSizeEnum.Medium} />
        </div>
    ),
};

export const WithCustomHueValue: Story = {
    args: {
        name: 'John Doe',
        color: { hue: 180 },
    },
};

export const WithCustomHSLColor: Story = {
    args: {
        name: 'John Doe',
        color: { hsl: 'hsl(120, 100%, 50%)' },
    },
};

export const Anonymous: Story = {
    args: {
        name: '',
    },
};

export const AvatarGrid: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '1rem' }}>
            <UserAvatar name="Alice" />
            <UserAvatar name="Bob" />
            <UserAvatar name="Charlie" />
            <UserAvatar name="David" />
            <UserAvatar />
        </div>
    ),
};
