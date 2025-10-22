import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import type { PublicBooking } from '../../interface';

interface DetailsHeaderProps {
    booking: PublicBooking;
}

export const DetailsHeader = ({ booking }: DetailsHeaderProps) => {
    return (
        <div className="mt-12">
            <h1 className="mb-2 text-2xl text-bold">{booking.title}</h1>
            <p className="color-weak m-0 mb-6">{booking.description}</p>
            <div className="color-weak">
                <div className="flex gap-3 items-center mb-2">
                    <Icon name="clock" />
                    <span>{c('Info').t`${booking.duration} min duration`}</span>
                </div>
                <div className="flex gap-3 items-center mb-2">
                    <Icon name="map-pin" />
                    <span>{booking.location}</span>
                </div>
                <div className="flex gap-3 items-center">
                    <Icon name="earth" />
                    <span>{booking.timezone}</span>
                </div>
            </div>
        </div>
    );
};
