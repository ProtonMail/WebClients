import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { IcClock } from '@proton/icons/icons/IcClock';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';

import { useBookingStore } from '../../booking.store';

export const DetailsHeader = () => {
    const bookingDetails = useBookingStore(
        useShallow((state) => {
            if (!state.bookingDetails) {
                return null;
            }
            return {
                summary: state.bookingDetails.summary,
                description: state.bookingDetails.description,
                location: state.bookingDetails.location,
                duration: state.bookingDetails.duration,
                timezone: state.bookingDetails.timezone,
            };
        })
    );

    if (!bookingDetails) {
        return null;
    }
    return (
        <div className="mt-12">
            <h1 className="mb-2 text-2xl text-bold">{bookingDetails?.summary}</h1>
            <p className="color-weak m-0 mb-6">{bookingDetails.description}</p>
            <div className="color-weak">
                <div className="flex gap-3 items-center mb-2">
                    <IcClock />
                    <span>{c('Info').t`${bookingDetails.duration} min duration`}</span>
                </div>
                <div className="flex gap-3 items-center mb-2">
                    <IcMapPin />
                    <span>{bookingDetails.location}</span>
                </div>
                <div className="flex gap-3 items-center">
                    <IcEarth />
                    <span>{bookingDetails.timezone}</span>
                </div>
            </div>
        </div>
    );
};
