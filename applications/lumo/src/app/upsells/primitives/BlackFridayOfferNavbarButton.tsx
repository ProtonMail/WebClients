import { c } from 'ttag';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { GetLumoPlusContent } from './GetLumoPlusContent';

export const BlackFridayOfferNavbarButton = ({
    onUpgrade,
    className,
}: {
    onUpgrade: () => void;
    className: string;
}) => {
    const { isSmallScreen, isMediumScreen } = useIsLumoSmallScreen();

    const ctaText = c('BF2025: Action (top button in header)').t`Black Friday`;

    return (
        <PromotionButton
            as="button"
            type="button"
            color="norm"
            size={isSmallScreen ? 'small' : 'medium'}
            responsive
            shape="solid"
            buttonGradient={true}
            iconGradient={true}
            iconSize={4}
            iconName="gift"
            fullGradient={!isMediumScreen}
            onClick={onUpgrade}
            className={className}
            pill={false}
            data-testid="cta:special-offer"
        >
            <GetLumoPlusContent customText={ctaText} withGradient={false} customTextClass="text-lg" />
        </PromotionButton>
    );
};
