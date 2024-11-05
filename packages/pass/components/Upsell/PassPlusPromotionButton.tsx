import type { FC } from 'react';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton/PromotionButton';
import clsx from '@proton/utils/clsx';

type Props = Omit<PromotionButtonProps<'span'>, 'size'>;

export const PassPlusPromotionButton: FC<Props> = ({ className, ...props }) => (
    <PromotionButton
        iconName="brand-proton-pass"
        iconGradient={false}
        icon
        size="small"
        shape="outline"
        as="span"
        {...props}
        className={clsx(className, 'flex items-center button-xs')}
        iconSize={3.5}
    />
);
