import type { Meta, StoryObj } from '@storybook/react';

import { InlineLinkButton } from './InlineLinkButton';

const meta: Meta<typeof InlineLinkButton> = {
    args: {
        children: 'Inline link button',
        onClick: () => alert('See? This is a real button.'),
    },
    component: InlineLinkButton,
    parameters: {
        docs: {
            description: {
                component:
                    'The InlineLinkButton component is a button with the exact look and behaviour of a link, <b>should ONLY be used inside a text content</b>.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InlineLinkButton>;

export const Default: Story = {};

export const InsideParagraph: Story = {
    render: (args) => (
        <p>
            This is a paragraph with an <InlineLinkButton {...args}>inline link button</InlineLinkButton> inside.
        </p>
    ),
};
