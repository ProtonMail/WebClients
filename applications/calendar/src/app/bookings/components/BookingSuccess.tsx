import type { ReactElement, ReactNode } from 'react';
import { Redirect } from 'react-router-dom';

import { addMinutes, format } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import LumoLogo from '@proton/components/components/logo/LumoLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcClock } from '@proton/icons/icons/IcClock';
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

const IconHeroWorldMap24 = ({ className }: { className?: string }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 21C16.1926 21 19.7156 18.1332 20.7157 14.2529M12 21C7.80742 21 4.28442 18.1332 3.2843 14.2529M12 21C14.4853 21 16.5 16.9706 16.5 12C16.5 7.02944 14.4853 3 12 3M12 21C9.51472 21 7.5 16.9706 7.5 12C7.5 7.02944 9.51472 3 12 3M12 3C15.3652 3 18.299 4.84694 19.8431 7.58245M12 3C8.63481 3 5.70099 4.84694 4.15692 7.58245M19.8431 7.58245C17.7397 9.40039 14.9983 10.5 12 10.5C9.00172 10.5 6.26027 9.40039 4.15692 7.58245M19.8431 7.58245C20.5797 8.88743 21 10.3946 21 12C21 12.778 20.9013 13.5329 20.7157 14.2529M20.7157 14.2529C18.1334 15.6847 15.1619 16.5 12 16.5C8.8381 16.5 5.86662 15.6847 3.2843 14.2529M3.2843 14.2529C3.09871 13.5329 3 12.778 3 12C3 10.3946 3.42032 8.88743 4.15692 7.58245"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const IconHeroCheckmarkCircle = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="48"
            height="48"
            fill="none"
            viewBox="0 0 48 48"
        >
            <path d="M40.5 24c0-9.113-7.387-16.5-16.5-16.5S7.5 14.887 7.5 24 14.887 40.5 24 40.5 40.5 33.113 40.5 24Zm3 0c0 10.77-8.73 19.5-19.5 19.5S4.5 34.77 4.5 24 13.23 4.5 24 4.5 43.5 13.23 43.5 24Z" />
            <path
                className="booking-icon-success-checkmark"
                d="M28.78 18.628a1.5 1.5 0 0 1 2.44 1.744l-7.5 10.5a1.5 1.5 0 0 1-2.28.189l-4.5-4.5a1.5 1.5 0 0 1 2.12-2.121l3.248 3.247 6.471-9.059Z"
            />
        </svg>
    );
};

const BookingSuccessItem = ({ icon, title, data }: BookingSuccessItemProps) => {
    return (
        <div className="flex gap-3">
            <div
                className="shrink-0 rounded-full flex items-center justify-center w-custom h-custom booking-color-title booking-success-item-icon"
                style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
            >
                {icon}
            </div>
            <div className="flex-1">
                <h2 className="m-0 text-semibold text-rg booking-color-title">{title}</h2>
                <div
                    className="text-break max-w-full booking-success-item-data"
                    title={typeof data === 'string' ? data : ''}
                >
                    {data}
                </div>
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
        // Redirect the user on the main page on reload
        const hash = window.location.hash;
        if (hash) {
            const redirectPath = isGuest ? '/bookings/guest' : '/bookings';
            return <Redirect to={`${redirectPath}${hash}`} />;
        }
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
                className="mx-auto mt-8 bg-norm p-8 md:p-12 booking-success-container max-w-custom"
                style={{ '--max-w-custom': '37.5rem' }}
            >
                <div className="text-center mb-6">
                    <IconHeroCheckmarkCircle className="mb-2 fill-success" />

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
                        icon={<IcCalendarGrid size={6} />}
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

                    <BookingSuccessItem title={c('Title').t`Time`} icon={<IcClock size={6} />} data={timeData} />

                    <BookingSuccessItem
                        title={c('Title').t`Time zone`}
                        icon={<IconHeroWorldMap24 />}
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
                        <span className="text-sm mt-3 booking-success-powered-by">{c('Info').t`Powered by`}</span>
                        <ProtonLogo />
                    </p>

                    <h2 className="text-3xl booking-color-title font-arizona">{c('Info')
                        .t`Take control of your digital life`}</h2>
                    <p className="text-wrap-balance mb-6 booking-color-title">{c('Info')
                        .t`This booking was made via ${CALENDAR_APP_NAME}, part of ${BRAND_NAME}'s suite of privacy-first products.`}</p>

                    <p className="my-6">
                        <ButtonLike
                            as="a"
                            href="https://proton.me?ref=booking-success"
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
                            <span className="block text-sm booking-success-app-name">{MAIL_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <VpnLogo variant="glyph-only" />
                            <span className="block text-sm booking-success-app-name">{VPN_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <PassLogo variant="glyph-only" />
                            <span className="block text-sm booking-success-app-name">{PASS_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <LumoLogo variant="glyph-only" />
                            <span className="block text-sm booking-success-app-name">{LUMO_SHORT_APP_NAME}</span>
                        </span>
                        <span className="">
                            <DriveLogo variant="glyph-only" />
                            <span className="block text-sm booking-success-app-name">{DRIVE_SHORT_APP_NAME}</span>
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};
