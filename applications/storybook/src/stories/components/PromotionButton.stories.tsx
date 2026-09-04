import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { IcBrandProtonMailFilledPlus } from '@proton/icons/icons/IcBrandProtonMailFilledPlus';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';

const meta: Meta<typeof PromotionButton> = {
    title: 'Components/Promotion Button',
    args: {
        children: 'Upgrade',
    },
    component: PromotionButton,
    parameters: {
        docs: {
            description: {
                component:
                    'A button with promotional gradient styling. Supports icons, responsive layout, ghost shape, upsell variant, and can be composed via ButtonLike.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PromotionButton>;

export const Default: Story = {};

export const WithIcon: Story = {
    args: {
        iconComponent: IcBrandProtonMailFilledPlus,
        children: 'With Icon',
    },
};

export const IconOnly: Story = {
    args: {
        iconComponent: IcUpgrade,
        icon: true,
        shape: 'ghost',
        children: 'Icon Ghost',
    },
};

export const Responsive: Story = {
    args: {
        iconComponent: IcUpgrade,
        icon: true,
        responsive: true,
        children: 'Responsive',
    },
};

export const Upsell: Story = {
    args: {
        iconComponent: IcBrandProtonMailFilledPlus,
        icon: true,
        upsell: true,
        children: 'Upsell',
    },
};

export const NoIconGradient: Story = {
    args: {
        iconComponent: IcBrandProtonMailFilledPlus,
        iconGradient: false,
        children: 'No icon gradient',
    },
};

export const AsButtonLike: Story = {
    render: () => <ButtonLike as={PromotionButton}>ButtonLike</ButtonLike>,
};
