import type { Meta, StoryObj } from '@storybook/react';

import { Href } from '../Href/Href';
import { Banner } from './Banner';
import { BannerVariants } from './Banner';

const meta: Meta<typeof Banner> = {
    argTypes: {
        variant: {
            control: 'radio',
            options: Object.values(BannerVariants),
        },
    },
    args: {
        children: 'I am a banner',
        variant: BannerVariants.NORM,
    },
    component: Banner,
    parameters: {
        docs: {
            description: {
                component: 'Banner component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Banner>;

export const Default: Story = {};

const AllVariantsWithProps = (props: any = {}) => (
    <>
        {Object.values(BannerVariants)
            .sort()
            .map((variant) => (
                <Banner key={variant} variant={variant} {...props} children={props.children || variant} />
            ))}
    </>
);

export const AllVariants: Story = {
    render: () => AllVariantsWithProps(),
};

export const AllVariantsWithLargeRadius: Story = {
    render: () => AllVariantsWithProps({ largeRadius: true }),
};

export const AllVariantsDismissable: Story = {
    render: () => AllVariantsWithProps({ onDismiss: () => alert('Dismissed') }),
};

export const AllVariantsWithNoIcon: Story = {
    render: () => AllVariantsWithProps({ noIcon: true }),
};

export const AllVariantsWithLink: Story = {
    render: () => AllVariantsWithProps({ link: <Href href="#">Link</Href> }),
};

export const AllVariantsWithLongText: Story = {
    render: () => {
        const LONG_TEXT =
            'Lorem ipsum dolor sit amet consectetur adipiscing elit quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi.';
        return AllVariantsWithProps({ children: LONG_TEXT });
    },
};
