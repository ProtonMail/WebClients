import type { FC } from 'react';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton/PromotionButton';
import clsx from '@proton/utils/clsx';

export const PassPlusPromotionButton: FC<PromotionButtonProps<'button'>> = ({ className, ...props }) => (
    <PromotionButton
        iconName="brand-proton-pass"
        iconGradient={false}
        icon
        size="small"
        shape="outline"
        className={clsx(className, 'flex items-center')}
        {...props}
    />
);
