import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useShallow } from 'zustand/react/shallow';

import { Loader } from '@proton/components/index';

import { useBookingStore } from '../../booking.store';
import { usePublicBookingLoader } from '../../usePublicBookingLoader';
import { NoMatch, Reason } from '../NoMatch';
import { DetailsFooter } from './DetailsFooter';
import { DetailsHeader } from './DetailsHeader';
import { DetailsSlotPicking } from './DetailsSlotPicking';

export const BookingDetails = () => {
    const location = useLocation();
    const bookingSecret = location.hash.substring(1);
    const { loadPublicBooking } = usePublicBookingLoader();
    const { isLoading, hasLoaded, isEmpty } = useBookingStore(
        useShallow((state) => ({
            isLoading: state.isLoading,
            hasLoaded: state.hasLoaded,
            isEmpty: !state.bookingDetails,
        }))
    );

    useEffect(() => {
        if (!bookingSecret) {
            return;
        }
        void loadPublicBooking(bookingSecret);
    }, [loadPublicBooking, bookingSecret]);

    if (!bookingSecret) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!isLoading && hasLoaded && isEmpty) {
        return <NoMatch reason={Reason.notFound} />;
    }

    if (!hasLoaded && isLoading) {
        return <Loader />;
    }

    return (
        <div className="mt-12">
            <DetailsHeader />
            <DetailsSlotPicking />
            <DetailsFooter />
        </div>
    );
};
