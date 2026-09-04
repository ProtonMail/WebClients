import { type ReactNode, useRef } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { IconComponent } from '@proton/icons/component';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import clsx from '@proton/utils/clsx';

import { PromotionButton } from '../../../button/PromotionButton/index';
import Spotlight from '../../../spotlight/Spotlight';

interface Props {
    promoOnClick: () => void;
    promoLoading?: boolean;
    promoIcon?: IconComponent;
    promoChildren: ReactNode;
    promoColor: 'full-gradient' | 'norm' | 'outline-gradient';
    spotlightBorderRadius?: 'xl' | 'md';
    spotlightShow: boolean;
    spotlightContent: ReactNode;
    spotlightInnerClassName?: string;
    spotlightOnClose?: () => void;
}

/**
 * Components that will show a promotional button wrapped by a spotlight.
 * This is useful for offers that appears at the top right corner of the app
 */
export const SpotlightWithPromo = ({
    promoOnClick,
    promoLoading = false,
    promoIcon,
    promoChildren,
    promoColor,
    spotlightBorderRadius = 'md',
    spotlightShow,
    spotlightContent,
    spotlightInnerClassName,
    spotlightOnClose,
}: Props) => {
    const buttonRef = useRef(null);

    return (
        <Spotlight
            anchorRef={buttonRef}
            content={spotlightContent}
            show={!promoLoading && spotlightShow}
            borderRadius={spotlightBorderRadius}
            innerClassName={spotlightInnerClassName}
            onClose={spotlightOnClose}
            closeIcon={<IcCrossBig />}
        >
            <div ref={buttonRef}>
                <PromotionButton
                    as={ButtonLike}
                    className={clsx(
                        'flex items-center gap-2',
                        promoColor === 'norm' && 'color-primary hover:color-primary'
                    )}
                    onClick={promoOnClick}
                    iconComponent={promoIcon}
                    loading={promoLoading}
                    disabled={promoLoading}
                    size="medium"
                    buttonGradient={promoColor === 'outline-gradient'}
                    fullGradient={promoColor === 'full-gradient'}
                    responsive
                >
                    {promoChildren}
                </PromotionButton>
            </div>
        </Spotlight>
    );
};
