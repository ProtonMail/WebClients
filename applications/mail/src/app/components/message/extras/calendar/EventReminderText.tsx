import { useEffect, useState } from 'react';

import { differenceInDays } from 'date-fns';
import { c, msgid } from 'ttag';

import { DeprecatedBanner, DeprecatedBannerBackgroundColor } from '@proton/components';
import { DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';
import type { Nullable } from '@proton/shared/lib/interfaces';

export interface EventReminderTextProps {
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
}

const EventReminderText = ({ isAllDay, startDate, endDate }: EventReminderTextProps) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 30 * SECOND);

        return () => {
            clearInterval(interval);
        };
    }, [startDate]);

    const msUntilEvent = +startDate - +now;
    const hasStarted = msUntilEvent <= 0;
    const hasEnded = +endDate < +now;

    const getMessageInfo = (): Nullable<[DeprecatedBannerBackgroundColor, string]> => {
        if (hasEnded) {
            return [DeprecatedBannerBackgroundColor.WARNING, c('Calendar widget banner').t`Event already ended`];
        }

        if (hasStarted) {
            return [DeprecatedBannerBackgroundColor.WARNING, c('Calendar widget banner').t`Event in progress`];
        }

        if (!isAllDay && msUntilEvent < HOUR) {
            const minutesUntilEvent = Math.round(msUntilEvent / MINUTE);
            const text =
                minutesUntilEvent === 0
                    ? c('Email reminder banner').t`Event starting now`
                    : c('Email reminder banner').ngettext(
                          msgid`Event starts in ${minutesUntilEvent} minute`,
                          `Event starts in ${minutesUntilEvent} minutes`,
                          minutesUntilEvent
                      );
            return [DeprecatedBannerBackgroundColor.INFO, text];
        }

        if (isAllDay && msUntilEvent < DAY) {
            const text =
                differenceInDays(endDate, startDate) === 1
                    ? c('Email reminder banner').t`Event is tomorrow`
                    : c('Email reminder banner').t`Event starts tomorrow`;
            return [DeprecatedBannerBackgroundColor.INFO, text];
        }

        return null;
    };

    const messageInfo = getMessageInfo();

    if (!messageInfo) {
        return null;
    }

    const [backgroundColor, text] = messageInfo;

    return (
        <DeprecatedBanner backgroundColor={backgroundColor} icon="bell">
            {text}
        </DeprecatedBanner>
    );
};

export default EventReminderText;
