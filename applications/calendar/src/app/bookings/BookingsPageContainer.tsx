import type { PropsWithChildren } from 'react';

import UnAuthenticated from '@proton/components/containers/authentication/UnAuthenticated';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';

import config from '../config';
import { BookingsRouter } from './BookingsRouter';

export const BookingPageContainer = ({ children }: PropsWithChildren) => {
    return <UnAuthenticated>{children}</UnAuthenticated>;
};

export const BookingsApp = () => {
    return (
        <ThemeProvider appName={config.APP_NAME}>
            <BookingPageContainer>
                <BookingsRouter />
            </BookingPageContainer>
        </ThemeProvider>
    );
};
