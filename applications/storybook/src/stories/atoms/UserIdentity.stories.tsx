import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { UserIdentity } from '@proton/atoms/UserIdentity/UserIdentity';

const meta: Meta<typeof UserIdentity> = {
    title: 'Atoms/UserIdentity',
    component: UserIdentity,
    parameters: {
        docs: {
            description: {
                component:
                    'An avatar with the initials of a user, and their name and email stacked next to it. The email is hidden when it is the same as the name (case-insensitive), and the name is then vertically centered with the avatar. The name inherits its color from the parent. Pass `onClick` to make the text a button. Renders nothing when there is neither a name nor an email.',
            },
        },
    },
    args: {
        name: 'Alice Anderson',
        email: 'alice.anderson@proton.me',
    },
    decorators: [
        (Story) => (
            <div className="w-custom" style={{ '--w-custom': '20rem' }}>
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof UserIdentity>;

export const Default: Story = {};

export const NameEqualsEmail: Story = {
    name: 'Name equals email',
    args: { name: 'alice.anderson@proton.me', email: 'Alice.Anderson@proton.me' },
};

export const NameOnly: Story = {
    args: { email: undefined },
};

export const EmailOnly: Story = {
    args: { name: undefined },
};

export const InWeakParent: Story = {
    name: 'Inside a color-weak parent',
    decorators: [
        (Story) => (
            <div className="color-weak">
                <Story />
            </div>
        ),
    ],
};

export const LongValues: Story = {
    name: 'Long values are truncated',
    args: {
        name: 'Alexandra Konstantinopoulou-Vanderberg',
        email: 'alexandra.konstantinopoulou-vanderberg@a-very-long-company-domain.example',
    },
};

export const Clickable: Story = {
    argTypes: {
        onClick: { action: 'clicked' },
    },
};
