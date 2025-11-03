import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';

import { Loader } from '@proton/components/index';
import { getWeekStartsOn } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../../booking.store';
import { useExternalBookingLoader } from '../../useExternalBookingLoader';
import { NoMatch, Reason } from '../NoMatch';
import { DetailsFooter } from './DetailsFooter';
import { DetailsHeader } from './DetailsHeader';
import { DetailsSlotPicking } from './DetailsSlotPicking';

export const BookingDetails = () => {
    const location = useLocation();
    const bookingSecretBase64Url = location.hash.substring(1);
    const { loadPublicBooking } = useExternalBookingLoader();
    const { isLoading, hasLoaded, isEmpty } = useBookingStore(
        useShallow((state) => ({
            isLoading: state.isLoading,
            hasLoaded: state.hasLoaded,
            isEmpty: !state.bookingDetails,
        }))
    );

    useEffect(() => {
        if (!bookingSecretBase64Url) {
            return;
        }

        const now = new Date();
        const weekStartsOn = getWeekStartsOn(dateLocale);
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const rangeStart = startOfWeek(monthStart, { weekStartsOn });
        const rangeEnd = endOfWeek(monthEnd, { weekStartsOn });

        const displayedDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

        void loadPublicBooking(bookingSecretBase64Url, displayedDays);
    }, [bookingSecretBase64Url, loadPublicBooking]);

    if (!bookingSecretBase64Url) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!isLoading && hasLoaded && isEmpty) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!hasLoaded && isLoading) {
        return <Loader />;
    }

    return (
        <div className="mt-12 max-w-custom mx-auto" style={{ '--max-w-custom': '640px' }}>
            <DetailsHeader />
            <DetailsSlotPicking />
            <DetailsFooter />
        </div>
    );
};
