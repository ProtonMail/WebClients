import type { Meta, StoryObj } from '@storybook/react';

import { UserAvatar } from './UserAvatar';
import UserAvatarDocs from './UserAvatar.mdx';

const meta: Meta<typeof UserAvatar> = {
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
            description: 'Name to display in the avatar',
        },
        color: {
            control: 'object',
            description: 'Custom color configuration',
        },
        useFirstLetterOfName: {
            control: 'boolean',
            description: 'Whether to show only the first letter or full name',
        },
        size: {
            control: 'radio',
            options: ['small', 'medium'],
            description: 'Size of the avatar',
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
        },
        as: {
            control: 'text',
            description: 'Custom element type',
        },
    },
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

export const Default: Story = {
    args: {
        name: 'John Doe',
        size: 'medium',
    },
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <UserAvatar name="John" size="small" />
            <UserAvatar name="Jane" size="medium" />
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
        </div>
    ),
};
