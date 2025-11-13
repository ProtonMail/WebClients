import type { ReactElement, ReactNode } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../booking.store';
import { NoMatch, Reason } from './NoMatch';

interface BookingSuccessItemProps {
    icon: ReactElement;
    title: string;
    data: ReactNode | string;
}

const BookingSuccessItem = ({ icon, title, data }: BookingSuccessItemProps) => {
    return (
        <div className="flex gap-3">
            <div
                className="rounded-full bg-weak flex items-center justify-center w-custom h-custom"
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
            >
                {icon}
            </div>
            <div>
                <h2 className="m-0 text-semibold text-rg">{title}</h2>
                <p className="m-0">{data}</p>
            </div>
        </div>
    );
};

export const BookingSuccess = () => {
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedBookingSlot = useBookingStore((state) => state.selectedBookingSlot);

    if (!bookingDetails || !selectedBookingSlot) {
        return <NoMatch reason={Reason.notFound} />;
    }

    const timeData = `${format(selectedBookingSlot.startTime, 'HH:mm', { locale: dateLocale })} - ${format(selectedBookingSlot.endTime, 'HH:mm', { locale: dateLocale })}`;

    return (
        <div className="container">
            <div className="mt-8 bg-hint p-12 rounded-xl">
                <div className="text-center mb-6">
                    <IcCheckmarkCircle size={10} className="color-success mb-2" />
                    <h1 className="text-bold text-4xl mb-2">{c('Title').t`Your booking is confirmed`}</h1>
                    <p className="m-0">{c('Description').t`You’ll get a secure email with the details shortly.`}</p>
                </div>
                <hr />
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-column gap-4">
                        <BookingSuccessItem
                            title={c('Title').t`Host`}
                            icon={<IcUserCircle />}
                            data={bookingDetails.inviterDisplayName || bookingDetails.inviterEmail}
                        />
                        <BookingSuccessItem
                            title={c('Title').t`Location`}
                            icon={<IcMapPin />}
                            data={bookingDetails.location}
                        />
                        <BookingSuccessItem
                            title={c('Title').t`Time zone`}
                            icon={<IcGlobe />}
                            data={bookingDetails.timezone}
                        />
                    </div>

                    <div className="flex flex-column gap-4">
                        <BookingSuccessItem
                            title={c('Title').t`Date`}
                            icon={<IcCalendarGrid />}
                            data={format(selectedBookingSlot.startTime, 'MMMM d, yyyy', { locale: dateLocale })}
                        />
                        <BookingSuccessItem title={c('Title').t`Time`} icon={<IcClock />} data={timeData} />
                    </div>
                </div>
            </div>
        </div>
    );
};
