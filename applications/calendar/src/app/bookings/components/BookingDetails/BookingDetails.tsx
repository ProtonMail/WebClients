import Loader from '@proton/components/components/loader/Loader';

import { useBookingStore } from '../../booking.store';
import { NoMatch, Reason } from '../NoMatch';
import { DetailsFooter } from './DetailsFooter';
import { DetailsHeader } from './DetailsHeader';
import { DetailsSlotPicking } from './DetailsSlotPicking';

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
        <div className="mt-12 max-w-custom mx-auto" style={{ '--max-w-custom': '640px' }}>
            <DetailsHeader />
            <DetailsSlotPicking />
            <DetailsFooter />
        </div>
    );
};
