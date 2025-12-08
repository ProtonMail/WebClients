import Loader from '@proton/components/components/loader/Loader';
import useFlag from '@proton/unleash/useFlag';

import { useBookingStore } from '../../booking.store';
import { NoMatch, Reason } from '../NoMatch';
import { BookingDetails } from './BookingDetails';
import { BookingFooter } from './BookingFooter';
import { BookingTimeSlotGrid } from './BookingTimeSlotGrid';

export const BookingPage = () => {
    const isLoading = useBookingStore((state) => state.isLoading);
    const hasLoaded = useBookingStore((state) => state.hasLoaded);
    const isEmpty = useBookingStore((state) => !state.bookingDetails);

    const isExternalBookingsEnabled = useFlag('CalendarExternalBookings');

    if (!isLoading && hasLoaded && isEmpty) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!isExternalBookingsEnabled) {
        return <NoMatch reason={Reason.featureUnavailable} />;
    }

    if (!hasLoaded && isLoading) {
        return <Loader />;
    }

    return (
        <div className="mt-12 mx-auto">
            <div className="flex *:min-size-auto flex-column flex-nowrap gap-6 md:gap-12 booking-wrapper items-start">
                <BookingDetails />
                <BookingTimeSlotGrid />
            </div>
            <BookingFooter />
        </div>
    );
};
