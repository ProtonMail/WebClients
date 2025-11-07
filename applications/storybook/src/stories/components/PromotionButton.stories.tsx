import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';

import mdx from './PromotionButton.mdx';

export default {
    component: PromotionButton,
    title: 'components/Promotion Button',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Example = () => <PromotionButton>Regular</PromotionButton>;

export const ExampleWithIcon = () => (
    <PromotionButton iconName="brand-proton-mail-filled-plus">With Icon</PromotionButton>
);

export const ExampleIconOnly = () => (
    <PromotionButton iconName="upgrade" icon={true} shape="ghost">
        Icon Ghost
    </PromotionButton>
);

export const ExampleResponsive = () => (
    <PromotionButton iconName="upgrade" icon={true} responsive>
        Icon Ghost
    </PromotionButton>
);

export const ExampleIconSmall = () => (
    <PromotionButton iconName="brand-proton-mail-filled-plus" icon={true} upsell>
        Upsell
    </PromotionButton>
);

export const ExampleWithIconNoGradient = () => (
    <PromotionButton iconName="brand-proton-mail-filled-plus" iconGradient={false}>
        No icon gradient
    </PromotionButton>
);

export const ExampleLike = () => <ButtonLike as={PromotionButton}>ButtonLike</ButtonLike>;

export const Basic = ({ ...args }) => (
    <PromotionButton icon={true} iconName="users-plus" {...args}>
        Loremium
    </PromotionButton>
);

Basic.args = {};
