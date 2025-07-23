import { type ReactNode, useRef } from 'react';

import { ButtonLike } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { type IconName } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface Props {
    promoOnClick: () => void;
    promoLoading?: boolean;
    promoIconName?: IconName;
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
    promoIconName,
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
            closeIcon="cross-big"
        >
            <div ref={buttonRef}>
                <PromotionButton
                    as={ButtonLike}
                    className={clsx(
                        'flex items-center gap-2',
                        promoColor === 'norm' && 'color-primary hover:color-primary'
                    )}
                    onClick={promoOnClick}
                    iconName={promoIconName}
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
