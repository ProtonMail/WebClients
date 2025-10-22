import { c } from 'ttag';

import linkExpiredImage from '@proton/styles/assets/img/calendar-booking/booking-expired.svg';

import { RedirectToCalendarButton } from './RedirectToCalendar';

export enum Reason {
    notFound = 'not-found',
    expired = 'expired',
}

interface Props {
    reason: Reason;
}

const imgSrc: Record<Reason, string> = {
    // TODO replace with another image once image is ready
    [Reason.notFound]: linkExpiredImage,
    [Reason.expired]: linkExpiredImage,
};

export const NoMatch = ({ reason }: Props) => {
    const title: Record<Reason, string> = {
        [Reason.notFound]: c('Title').t`This booking page does not exist`,
        [Reason.expired]: c('Title').t`This booking page has expired`,
    };

    return (
        <div className="flex flex-column items-center mt-12">
            <img src={imgSrc[reason]} alt={title[reason]} className="mx-auto mb-6" />
            <h1 className="text-2xl text-bold">{title[reason]}</h1>
            <div className="mt-6 text-center">
                <p className="color-weak m-0">{c('Info').t`Want to create your own booking page?`}</p>
                <RedirectToCalendarButton shape="underline" color="norm" className="p-0" />
            </div>
        </div>
    );
};
