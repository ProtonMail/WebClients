import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';

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
        iconName: 'brand-proton-mail-filled-plus',
        children: 'With Icon',
    },
};

export const IconOnly: Story = {
    args: {
        iconName: 'upgrade',
        icon: true,
        shape: 'ghost',
        children: 'Icon Ghost',
    },
};

// TODO: Check why the snapshots are failing for this story
// export const Responsive: Story = {
//     args: {
//         iconName: 'upgrade',
//         icon: true,
//         responsive: true,
//         children: 'Icon Ghost',
//     },
// };

export const Upsell: Story = {
    args: {
        iconName: 'brand-proton-mail-filled-plus',
        icon: true,
        upsell: true,
        children: 'Upsell',
    },
};

export const NoIconGradient: Story = {
    args: {
        iconName: 'brand-proton-mail-filled-plus',
        iconGradient: false,
        children: 'No icon gradient',
    },
};

export const AsButtonLike: Story = {
    render: () => <ButtonLike as={PromotionButton}>ButtonLike</ButtonLike>,
};
