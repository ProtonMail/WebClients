import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { ThemeColor } from '@proton/colors';

const meta: Meta<typeof Href> = {
    title: 'Atoms/Href',
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

export const HrefAsButton: StoryObj<typeof ButtonLike> = {
    render: () => (
        <ButtonLike as={Href} href="https://proton.me" shape="solid" color={ThemeColor.Norm}>
            Read the docs
        </ButtonLike>
    ),
    parameters: {
        docs: {
            description: {
                story: 'The `Href` atom styled like a button by passing it as the `as` element of `ButtonLike`. Still a real `<a href>`. For the inverse (a `<button>` that looks like a link), see Atoms/Button → LinkLikeButton.',
            },
        },
    },
};
