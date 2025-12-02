import type { ReactElement, ReactNode } from 'react';

import { addMinutes, format } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DriveLogo, LumoLogo, MailLogo, PassLogo, ProtonLogo, VpnLogo } from '@proton/components';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    MEET_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { getTimezoneAndOffset } from '@proton/shared/lib/date/timezone';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useBookingStore } from '../booking.store';
import { useBookingsProvider } from '../entryPoints/BookingsExternalProvider';
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
                className="shrink-0 rounded-full bg-weak flex items-center justify-center w-custom h-custom booking-color-title"
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
            >
                {icon}
            </div>
            <div className="flex-1">
                <h2 className="m-0 text-semibold text-rg">{title}</h2>
                <p className="m-0 text-break max-w-full" title={typeof data === 'string' ? data : ''}>
                    {data}
                </p>
            </div>
        </div>
    );
};

export const BookingSuccess = () => {
    const bookingDetails = useBookingStore((state) => state.bookingDetails);
    const selectedBookingSlot = useBookingStore((state) => state.selectedBookingSlot);
    const selectedTimezone = useBookingStore((state) => state.selectedTimezone);

    const { isGuest } = useBookingsProvider();

    if (!bookingDetails || !selectedBookingSlot) {
        return <NoMatch reason={Reason.notFound} />;
    }

    const timeData = `${format(selectedBookingSlot.tzDate, 'HH:mm', { locale: dateLocale })} - ${format(addMinutes(selectedBookingSlot.tzDate, bookingDetails.duration || 0), 'HH:mm', { locale: dateLocale })}`;

    const hasLocation = !!bookingDetails.location.trim() || bookingDetails.withProtonMeetLink;

    const hostInformation = (
        <>
            {bookingDetails.inviterDisplayName && (
                <div className="text-ellipsis" title={bookingDetails.inviterDisplayName}>
                    {bookingDetails.inviterDisplayName}
                </div>
            )}
            <div className="text-ellipsis" title={bookingDetails.inviterEmail}>
                {bookingDetails.inviterEmail}
            </div>
        </>
    );

    return (
        <div className="container">
            <div
                className="mx-auto mt-8 bg-norm p-8 md:p-12 rounded-xl max-w-custom"
                style={{ '--max-w-custom': '37.5rem' }}
            >
                <div className="text-center mb-6">
                    <IcCheckmarkCircle size={10} className="color-success mb-2" />
                    <h1 className="text-5xl mb-2 booking-color-title font-arizona">{c('Title')
                        .t`Your booking is confirmed`}</h1>
                    <p className="m-0 booking-color-title text-lg">{c('Description')
                        .t`You’ll get a secure email with the details shortly.`}</p>
                </div>
                <hr className="bg-weak mb-6" />
                <div className="booking-success-grid gap-4 items-start max-w-full">
                    <BookingSuccessItem
                        title={c('Title').t`Host`}
                        icon={<IcUserCircle size={6} />}
                        data={hostInformation}
                    />
                    <BookingSuccessItem
                        title={c('Title').t`Date`}
                        icon={<IcCalendarGrid />}
                        data={format(selectedBookingSlot.tzDate, 'MMMM d, yyyy', { locale: dateLocale })}
                    />
                    {hasLocation && (
                        <BookingSuccessItem
                            title={c('Title').t`Location`}
                            icon={<IcMapPin size={6} />}
                            data={
                                bookingDetails.withProtonMeetLink
                                    ? c('Info').t`${MEET_APP_NAME} video call`
                                    : bookingDetails.location
                            }
                        />
                    )}

                    <BookingSuccessItem title={c('Title').t`Time`} icon={<IcClock />} data={timeData} />

                    <BookingSuccessItem
                        title={c('Title').t`Time zone`}
                        icon={<IcGlobe size={6} />}
                        data={getTimezoneAndOffset(
                            selectedTimezone || bookingDetails.timezone,
                            selectedBookingSlot.tzDate
                        )}
                    />
                </div>
            </div>

            {isGuest && (
                <div className="mx-auto text-center max-w-custom p-8" style={{ '--max-w-custom': '32rem' }}>
                    <p className="color-weak inline-flex flex-nowrap items-center gap-2 mt-0 mb-6">
                        <span className="text-sm mt-3">{c('Info').t`Powered by`}</span>
                        <ProtonLogo />
                    </p>

                    <h2 className="text-3xl booking-color-title font-arizona">{c('Info')
                        .t`Take control of your digital life`}</h2>
                    <p className="text-wrap-balance mb-6 booking-color-title">{c('Info')
                        .t`This booking was made via ${CALENDAR_APP_NAME}, part of ${BRAND_NAME}'s suite of privacy-first products.`}</p>

                    <p className="my-6">
                        <ButtonLike
                            as="a"
                            href="https://account.proton.me/signup?ref=booking-success"
                            pill
                            shape="solid"
                            color="norm"
                            size="large"
                            target="_blank"
                        >
                            {c('Action').t`Create a free account`}
                        </ButtonLike>
                    </p>

                    <p className="text-center inline-flex flex-row flex-wrap items-center gap-5 my-0">
                        <span className="">
                            <MailLogo variant="glyph-only" />
                            <span className="block">{MAIL_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <VpnLogo variant="glyph-only" />
                            <span className="block">{VPN_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <PassLogo variant="glyph-only" />
                            <span className="block">{PASS_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <LumoLogo variant="glyph-only" />
                            <span className="block">{LUMO_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <DriveLogo variant="glyph-only" />
                            <span className="block">{DRIVE_SHORT_APP_NAME}</span>
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};
