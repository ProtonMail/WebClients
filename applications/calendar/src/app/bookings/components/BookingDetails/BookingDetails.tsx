import { useEffect, useState } from 'react';
import type { RouteComponentProps } from 'react-router-dom';

import type { PublicBooking } from '../../interface';
import { DetailsFooter } from './DetailsFooter';
import { DetailsHeader } from './DetailsHeader';
import { DetailsSlotPicking } from './DetailsSlotPicking';

export const BookingDetails = ({ match }: RouteComponentProps<{ bookingId: string }>) => {
    const { bookingId } = match.params;

    const [booking, setBooking] = useState<PublicBooking | null>(null);

    useEffect(() => {
        if (!bookingId) {
            return;
        }

        setBooking({
            id: bookingId,
            title: '[Title] Meeting with Eric Norbert',
            description: 'Description e.g. Meeting goal is to decide how to move forward with the controlling tool',
            duration: 60,
            location: 'Zoom',
            timezone: 'GMT+1 • Europe/Zurich',
        });
    }, [bookingId]);

    if (!bookingId) {
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
