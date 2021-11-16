import { Banner } from '@proton/components';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import React from 'react';
import { c } from 'ttag';
import EventReminderText from './EventReminderText';

interface Props {
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    isOutdated?: boolean;
    isCancelled?: boolean;
}
const EventReminderBanner = ({ isAllDay, startDate, endDate, isOutdated, isCancelled }: Props) => {
    if (isOutdated) {
        return (
            <Banner icon="circle-exclamation" backgroundColor={BannerBackgroundColor.DANGER}>
                {c('Email reminder out of date alert').t`Event was updated. This reminder is out-of-date.`}
            </Banner>
        );
    }

    if (isCancelled) {
        return (
            <Banner icon="circle-exclamation" backgroundColor={BannerBackgroundColor.WARNING}>
                {c('Email reminder out of date alert').t`Event was canceled`}
            </Banner>
        );
    }

    return <EventReminderText startDate={startDate} endDate={endDate} isAllDay={isAllDay} />;
};

export default EventReminderBanner;
