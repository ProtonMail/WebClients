import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { PublicBooking } from '../../interface';
import { DetailsFooter } from './DetailsFooter';
import { DetailsHeader } from './DetailsHeader';
import { DetailsSlotPicking } from './DetailsSlotPicking';

export const BookingDetails = () => {
    const { bookingID } = useParams<{ bookingID: string }>();
    const [booking, setBooking] = useState<PublicBooking | null>(null);

    useEffect(() => {
        if (!bookingID) {
            return;
        }

        setBooking({
            id: bookingID,
            title: '[Title] Meeting with Eric Norbert',
            description: 'Description e.g. Meeting goal is to decide how to move forward with the controlling tool',
            duration: 60,
            location: 'Zoom',
            timezone: 'GMT+1 • Europe/Zurich',
        });
    }, [bookingID]);

    if (!bookingID) {
        throw new Error('Booking not found');
    }

    // TODO change this to a loader while the booking is being fetched
    if (!booking) {
        return null;
    }

    return (
        <div className="mt-12">
            <DetailsHeader booking={booking} />
            <DetailsSlotPicking />
            <DetailsFooter />
        </div>
    );
};
