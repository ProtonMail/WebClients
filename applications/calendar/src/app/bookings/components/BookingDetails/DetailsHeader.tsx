import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import Icon from '@proton/components/components/icon/Icon';

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
                    <Icon name="clock" />
                    <span>{c('Info').t`${bookingDetails.duration} min duration`}</span>
                </div>
                <div className="flex gap-3 items-center mb-2">
                    <Icon name="map-pin" />
                    <span>{bookingDetails.location}</span>
                </div>
                <div className="flex gap-3 items-center">
                    <Icon name="earth" />
                    <span>{bookingDetails.timezone}</span>
                </div>
            </div>
        </div>
    );
};
