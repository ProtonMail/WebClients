import type { MouseEvent, ReactNode } from 'react';

import PromotionButton from '@proton/components/components/button/PromotionButton/PromotionButton';
import TopNavbarListItem from '@proton/components/components/topnavbar/TopNavbarListItem';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import clsx from '@proton/utils/clsx';

import type { OfferSurfaceProps } from './OfferSurface';

import './OfferNavbarButton.scss';

export interface OfferNavbarButtonProps extends OfferSurfaceProps {
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    label: string;
    icon: ReactNode;
    backgroundColor: string;
    color: string;
    className?: string;
}

export const OfferNavbarButton = ({
    offer,
    onClick,
    icon,
    backgroundColor,
    color,
    label,
    className,
}: OfferNavbarButtonProps) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <TopNavbarListItem collapsedOnDesktop={false} noShrink>
            <PromotionButton
                ref={offer.seenRef}
                as="button"
                type="button"
                color="norm"
                size={viewportWidth['<=small'] ? 'small' : 'medium'}
                responsive
                shape="solid"
                buttonGradient={false}
                iconGradient={false}
                iconContent={icon ?? undefined}
                onClick={onClick}
                className={clsx('offer-navbar-button', className)}
                style={{
                    '--offer-navbar-button-background': backgroundColor,
                    '--offer-navbar-button-color': color,
                }}
                data-testid="offer-navbar-button"
            >
                {label}
            </PromotionButton>
        </TopNavbarListItem>
    );
};
