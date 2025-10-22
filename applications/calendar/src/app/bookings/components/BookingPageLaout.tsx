import type { PropsWithChildren } from 'react';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';

import { BookingsHeader } from './BookingsHeader';

export const BookingPageLayout = ({ children }: PropsWithChildren) => {
    return (
        <div id="booking-app" className="h-full flex flex-column flex-nowrap">
            <BookingsHeader />
            <ErrorBoundary component={<StandardErrorPage />}>
                <Scroll className="flex-1 w-full">
                    <div className="container-section-sticky">{children}</div>
                </Scroll>
            </ErrorBoundary>
        </div>
    );
};
