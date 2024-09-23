import { c } from 'ttag';

import { Banner, BannerBackgroundColor } from '@proton/components';

import EventReminderText from './EventReminderText';

interface Props {
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    isOutdated?: boolean;
    isCanceled?: boolean;
}
const EventReminderBanner = ({ isAllDay, startDate, endDate, isOutdated, isCanceled }: Props) => {
    if (isCanceled) {
        return (
            <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.WARNING}>
                {c('Email reminder out of date alert').t`Event was canceled`}
            </Banner>
        );
    }

    if (isOutdated) {
        return (
            <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.DANGER}>
                {c('Email reminder out of date alert').t`Event was updated. This reminder is out-of-date.`}
            </Banner>
        );
    }

    return <EventReminderText startDate={startDate} endDate={endDate} isAllDay={isAllDay} />;
};

export default EventReminderBanner;
