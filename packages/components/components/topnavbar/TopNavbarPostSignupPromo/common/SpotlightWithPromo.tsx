import { type ReactNode, useRef } from 'react';

import { ButtonLike } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import Spotlight, { type SpotlightProps } from '@proton/components/components/spotlight/Spotlight';
import { type IconName } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface Props extends SpotlightProps {
    onPromoClick: () => void;
    promoLoading?: boolean;
    promoIconName?: IconName;
    promoChildren: ReactNode;
    promoColor: 'full-gradient' | 'norm';
    borderRadius?: 'xl' | 'md';
}

export const SpotlightWithPromo = ({
    onPromoClick,
    promoLoading = false,
    promoIconName,
    promoChildren,
    promoColor,
    borderRadius = 'md',
    ...rest
}: Props) => {
    const buttonRef = useRef(null);

    return (
        <Spotlight anchorRef={buttonRef} {...rest} show={!promoLoading && rest.show} borderRadius={borderRadius}>
            <div ref={buttonRef}>
                <PromotionButton
                    as={ButtonLike}
                    className={clsx(
                        'flex items-center gap-2',
                        promoColor === 'norm' && 'color-primary hover:color-primary'
                    )}
                    onClick={onPromoClick}
                    iconName={promoIconName}
                    loading={promoLoading}
                    disabled={promoLoading}
                    size="medium"
                    buttonGradient={false}
                    fullGradient={promoColor === 'full-gradient'}
                    responsive
                >
                    {promoChildren}
                </PromotionButton>
            </div>
        </Spotlight>
    );
};
