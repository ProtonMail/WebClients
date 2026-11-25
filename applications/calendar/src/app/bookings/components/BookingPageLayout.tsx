import type { PropsWithChildren } from 'react';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import PublicTopBanners from '@proton/components/containers/topBanners/PublicTopBanners';

import './Booking.scss';

export const BookingPageLayout = ({ children }: PropsWithChildren) => {
    return (
        <div data-testid="booking-app" className="h-full flex flex-column flex-nowrap booking-main-container">
            <PublicTopBanners />
            <ErrorBoundary component={<StandardErrorPage />}>
                <Scroll className="flex-1 w-full">
                    <div className="container-section-sticky">{children}</div>
                </Scroll>
            </ErrorBoundary>
        </div>
    );
};
