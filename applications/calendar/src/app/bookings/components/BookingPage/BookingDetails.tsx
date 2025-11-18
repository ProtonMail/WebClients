import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { IcClock } from '@proton/icons/icons/IcClock';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useBookingStore } from '../../booking.store';

export const BookingDetails = () => {
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
                withProtonMeetLink: state.bookingDetails.withProtonMeetLink,
                inviterDisplayName: state.bookingDetails.inviterDisplayName,
                inviterEmail: state.bookingDetails.inviterEmail,
            };
        })
    );

    if (!bookingDetails) {
        return null;
    }

    const hasLocation = !!bookingDetails.location.trim() || bookingDetails.withProtonMeetLink;
    const hasDescription = !!bookingDetails.description.trim();

    return (
        <header
            className="rounded-lg p-8 md:p-12 flex flex-column flex-nowrap mb-8 bg-norm booking-details-header"
            aria-labelledby="booking-details-header-title"
        >
            <h1 className="text-rg mb-2 color-primary text-bold" id="booking-details-header-title">{c('Title')
                .t`Appointment details`}</h1>
            <h2
                className={clsx(
                    'booking-color-title text-4xl m-0 text-break-all font-arizona',
                    hasDescription ? undefined : 'mb-4'
                )}
            >
                {bookingDetails?.summary}
            </h2>
            {hasDescription && <p className="my-6 text-pre-wrap text-break-all">{bookingDetails.description}</p>}
            <div className="flex flex-column flex-nowrap gap-4">
                <div className="flex flex-nowrap flex-row gap-3 items-start">
                    <div className="bg-weak shrink-0 rounded-full p-2">
                        <IcUserCircle className="booking-color-title" size={6} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-rg m-0 booking-color-title text-semibold">{c('Info').t`Host`}</h3>
                        {bookingDetails.inviterDisplayName && (
                            <div className="text-ellipsis" title={bookingDetails.inviterDisplayName}>
                                {bookingDetails.inviterDisplayName}
                            </div>
                        )}
                        <div className="text-ellipsis" title={bookingDetails.inviterEmail}>
                            {bookingDetails.inviterEmail}
                        </div>
                    </div>
                </div>
                <div className="flex flex-nowrap flex-row gap-3 items-start">
                    <div className="bg-weak shrink-0 rounded-full p-2">
                        <IcClock className="booking-color-title" size={6} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-rg m-0 booking-color-title text-semibold">{c('Info')
                            .t`Appointment duration`}</h3>
                        <div>{c('Info').t`${bookingDetails.duration} min duration`}</div>
                    </div>
                </div>
                {hasLocation && (
                    <div className="flex flex-nowrap flex-row gap-3 items-start">
                        <div className="bg-weak shrink-0 rounded-full p-2">
                            <IcMapPin className="booking-color-title" size={6} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-rg m-0 booking-color-title text-semibold">{c('Info').t`Location`}</h3>
                            <div className="text-break-all">
                                {bookingDetails.withProtonMeetLink
                                    ? c('Info').t`${MEET_APP_NAME} video call`
                                    : bookingDetails.location}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
