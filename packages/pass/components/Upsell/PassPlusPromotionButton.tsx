import type { FC } from 'react';

import { Icon } from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton/PromotionButton';
import clsx from '@proton/utils/clsx';

import './PassPlusPromotionButton.scss';

type Props = Omit<PromotionButtonProps<'span'>, 'size'>;

export const PassPlusPromotionButton: FC<Props> = ({ className, ...props }) => (
    <PromotionButton
        iconName="brand-proton-pass-filled"
        iconGradient={false}
        size="small"
        shape="outline"
        as="span"
        {...props}
        className={clsx('pass-promo--button', className, 'flex items-center')}
        iconSize={3.5}
        style={{
            ...props.style,
            '--upgrade-color-stop-1': '#fcd38d',
            '--upgrade-color-stop-2': '#9834ff',
        }}
    >
        <Icon name="plus" size={2.5} className="mb-0.5" />
    </PromotionButton>
);
