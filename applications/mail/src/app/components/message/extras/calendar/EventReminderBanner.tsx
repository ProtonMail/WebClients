import { c } from 'ttag';

import { Banner } from '@proton/atoms';

import EventReminderText from './EventReminderText';

interface Props {
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    isOutdated?: boolean;
    isCanceled?: boolean;
    className?: string;
}
const EventReminderBanner = ({ isAllDay, startDate, endDate, isOutdated, isCanceled, className }: Props) => {
    if (isCanceled) {
        return (
            <Banner variant="warning" className={className}>{c('Email reminder out of date alert')
                .t`Event was canceled`}</Banner>
        );
    }

    if (isOutdated) {
        return (
            <Banner variant="danger" className={className}>{c('Email reminder out of date alert')
                .t`Event was updated. This reminder is out-of-date.`}</Banner>
        );
    }

    return <EventReminderText startDate={startDate} endDate={endDate} isAllDay={isAllDay} className={className} />;
};

export default EventReminderBanner;
