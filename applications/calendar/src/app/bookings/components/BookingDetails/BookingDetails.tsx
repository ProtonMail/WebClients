import Loader from '@proton/components/components/loader/Loader';

import { useBookingStore } from '../../booking.store';
import { BookingsView } from '../BookingsView';
import { NoMatch, Reason } from '../NoMatch';
import { BookingFooter } from './BookingFooter';
import { DetailsHeader } from './DetailsHeader';

export const BookingDetails = () => {
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
            <div className="flex gap-6">
                <DetailsHeader />
                <BookingsView />
            </div>
            <BookingFooter />
        </div>
    );
};
