import { clsx } from 'clsx';
import { c } from 'ttag';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';

export const SpringSaleOfferNavbarButton = ({ onUpgrade, className }: { onUpgrade: () => void; className: string }) => {
    const { isMediumScreen } = useIsLumoSmallScreen();

    const ctaText = c('q1campaign: Action').t`Spring Sale`;

    return (
        <PromotionButton
            as="button"
            type="button"
            color="norm"
            size={isMediumScreen ? 'small' : 'medium'}
            responsive
            shape="solid"
            buttonGradient={false}
            iconGradient={false}
            iconSize={4}
            iconName="percent"
            fullGradient={!isMediumScreen}
            onClick={onUpgrade}
            className={clsx('button-promotion--pink', className)}
            pill={false}
            data-testid="cta:special-offer"
        >
            {ctaText}
        </PromotionButton>
    );
};
