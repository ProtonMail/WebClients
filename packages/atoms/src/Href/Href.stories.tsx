import type { Meta, StoryObj } from '@storybook/react';

import { Href } from './Href';

const meta: Meta<typeof Href> = {
    args: {
        children: 'Visit the Proton website',
        href: 'https://proton.me',
    },
    component: Href,
    parameters: {
        docs: {
            description: {
                component:
                    'Simple anchor tag wrapper with opinionated defaults, `href` defaults to `#`, `target` defaults to `_blank`, and `rel` defaults to `noopener noreferrer nofollow`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Href>;

export const Default: Story = {};
