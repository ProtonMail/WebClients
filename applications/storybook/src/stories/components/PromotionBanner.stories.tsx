import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';

const icon = (
    <div
        className="rounded shadow-norm flex items-center justify-center w-custom h-custom"
        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem', background: 'white' }}
    >
        <IcShield2Bolt size={6} className="color-primary" />
    </div>
);

const twoLineDescription = (
    <>
        <strong>Protect your account with advanced security.</strong>
        <br />
        Get extra protection against phishing and account takeover.
    </>
);

const linkCta = (
    <Button type="button" className="text-bold" shape="underline" color="norm">
        Upgrade
    </Button>
);

const buttonCta = (
    <Button color="norm" fullWidth>
        Learn more
    </Button>
);

const meta: Meta<typeof PromotionBanner> = {
    title: 'Components/Promotion Banner',
    args: {
        description: 'Upgrade to automatically delete messages that have been in Trash or Spam for more than 30 days.',
        cta: linkCta,
    },
    argTypes: {
        rounded: {
            control: 'select',
            options: [false, true, 'md', 'lg', 'xl'],
        },
        mode: {
            control: 'inline-radio',
            options: ['row', 'banner'],
        },
        gradient: {
            control: 'inline-radio',
            options: ['horizontal', 'vertical'],
        },
        icon: { control: false },
        description: { control: false },
        cta: { control: false },
    },
    component: PromotionBanner,
    parameters: {
        docs: {
            description: {
                component:
                    'A banner with promotional gradient styling, used for upsells. Supports an optional icon, description and call to action, centered or left-aligned content, row and banner layouts, horizontal or vertical gradients, rounded corners and a dismiss button.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PromotionBanner>;

/** Centered content in `row` mode, as used for full-width upsells above lists. */
export const Default: Story = {};

export const WithDismissAction: Story = {
    args: {
        hasDismissAction: true,
    },
};

/** Left-aligned content in `banner` mode with an icon, a two-line description and a button, as used in settings pages. */
export const Banner: Story = {
    args: {
        mode: 'banner',
        rounded: 'xl',
        contentCentered: false,
        icon,
        description: twoLineDescription,
        cta: buttonCta,
    },
};

export const Row: Story = {
    args: {
        mode: 'row',
        rounded: 'lg',
        contentCentered: false,
        icon,
        description: twoLineDescription,
        cta: buttonCta,
    },
};

export const BannerWithoutIcon: Story = {
    args: {
        mode: 'banner',
        rounded: 'xl',
        contentCentered: false,
        description: <strong>Upgrade now to view activity across your organization.</strong>,
        cta: buttonCta,
    },
};

export const BannerWithIconCta: Story = {
    args: {
        mode: 'banner',
        rounded: 'xl',
        contentCentered: false,
        icon,
        description: twoLineDescription,
        cta: (
            <div className="mr-4">
                <IcChevronRight size={4} className="rtl:mirror" />
            </div>
        ),
    },
};

export const DescriptionOnly: Story = {
    args: {
        cta: undefined,
    },
};

export const VerticalGradient: Story = {
    args: {
        mode: 'banner',
        rounded: 'xl',
        contentCentered: false,
        gradient: 'vertical',
        icon,
        description: twoLineDescription,
        cta: buttonCta,
    },
};

export const RoundedValues: Story = {
    render: (args) => (
        <div className="flex flex-column gap-4">
            {([false, true, 'md', 'lg', 'xl'] as const).map((rounded) => (
                <PromotionBanner
                    key={String(rounded)}
                    {...args}
                    rounded={rounded}
                    description={`rounded={${rounded}}`}
                />
            ))}
        </div>
    ),
};

export const AllCombinations: Story = {
    render: (args) => (
        <div className="flex flex-column gap-4">
            {(['row', 'banner'] as const).flatMap((mode) =>
                (['horizontal', 'vertical'] as const).flatMap((gradient) =>
                    [true, false].map((contentCentered) => (
                        <PromotionBanner
                            key={`${mode}-${gradient}-${contentCentered}`}
                            {...args}
                            rounded="lg"
                            mode={mode}
                            gradient={gradient}
                            contentCentered={contentCentered}
                            icon={icon}
                            description={`mode="${mode}" gradient="${gradient}" contentCentered={${contentCentered}}`}
                            cta={buttonCta}
                        />
                    ))
                )
            )}
        </div>
    ),
};
