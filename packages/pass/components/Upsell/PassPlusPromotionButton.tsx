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
        className={clsx(className, 'flex items-center')}
        as="span"
        {...props}
    />
);
