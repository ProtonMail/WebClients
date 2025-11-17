import Loader from '@proton/components/components/loader/Loader';

import { useBookingStore } from '../../booking.store';
import { NoMatch, Reason } from '../NoMatch';
import { BookingDetails } from './BookingDetails';
import { BookingFooter } from './BookingFooter';
import { BookingTimeSlotGrid } from './BookingTimeSlotGrid';

export const BookingPage = () => {
    const isLoading = useBookingStore((state) => state.isLoading);
    const hasLoaded = useBookingStore((state) => state.hasLoaded);
    const isEmpty = useBookingStore((state) => !state.bookingDetails);

    if (!isLoading && hasLoaded && isEmpty) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!hasLoaded && isLoading) {
        return <Loader />;
    }

    return (
        <div className="mt-12 mx-auto">
            <div className="flex *:min-size-auto flex-column flex-nowrap gap-6 booking-wrapper items-start">
                <BookingDetails />
                <BookingTimeSlotGrid />
            </div>
            <BookingFooter />
        </div>
    );
};
