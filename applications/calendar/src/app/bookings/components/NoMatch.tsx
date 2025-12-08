import { c } from 'ttag';

import linkExpiredImage from '@proton/styles/assets/img/calendar-booking/booking-expired.svg';

import { BookingFooter } from './BookingPage/BookingFooter';

export enum Reason {
    notFound = 'not-found',
    expired = 'expired',
    featureUnavailable = 'feature-unavailable',
}

interface Props {
    reason: Reason;
}

const imgSrc: Record<Reason, string> = {
    // TODO replace with another image once image is ready
    [Reason.notFound]: linkExpiredImage,
    [Reason.expired]: linkExpiredImage,
    [Reason.featureUnavailable]: linkExpiredImage,
};

export const NoMatch = ({ reason }: Props) => {
    const title: Record<Reason, string> = {
        [Reason.notFound]: c('Title').t`This booking page can’t be shown.`,
        [Reason.expired]: c('Title').t`This booking page has expired.`,
        [Reason.featureUnavailable]: c('Title').t`The booking feature is currently unavailable.`,
    };

    const subline: Record<Reason, string> = {
        [Reason.notFound]: c('Text').t`Please check the link and try again.`,
        [Reason.expired]: c('Text').t`No bookings available.`,
        [Reason.featureUnavailable]: c('Text').t`Please try again later.`,
    };

    return (
        <div className="no-match w-full flex flex-column justify-center">
            <div className="flex-1 flex flex-column justify-center items-center">
                <img src={imgSrc[reason]} alt={title[reason]} className="mx-auto mb-6" />
                <h1 className="text-4xl text-center text-bold font-arizona booking-color-title mb-2">
                    {title[reason]}
                </h1>
                <p className="text-lg text-center booking-color-title m-0">{subline[reason]}</p>
            </div>
            <BookingFooter />
        </div>
    );
};
