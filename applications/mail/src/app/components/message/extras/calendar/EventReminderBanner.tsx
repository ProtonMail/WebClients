import { c } from 'ttag';

import { DeprecatedBanner, DeprecatedBannerBackgroundColor } from '@proton/components';

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
            <DeprecatedBanner icon="exclamation-circle" backgroundColor={DeprecatedBannerBackgroundColor.WARNING}>
                {c('Email reminder out of date alert').t`Event was canceled`}
            </DeprecatedBanner>
        );
    }

    if (isOutdated) {
        return (
            <DeprecatedBanner icon="exclamation-circle" backgroundColor={DeprecatedBannerBackgroundColor.DANGER}>
                {c('Email reminder out of date alert').t`Event was updated. This reminder is out-of-date.`}
            </DeprecatedBanner>
        );
    }

    return <EventReminderText startDate={startDate} endDate={endDate} isAllDay={isAllDay} />;
};

export default EventReminderBanner;
