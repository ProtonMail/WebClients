import { fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useDateCountdown } from '@proton/hooks';

export interface TimeRemainingProps {
    /**
     * The expiry date as a unix timestamp in seconds
     */
    expiry: number;
}

const TimeRemaining = ({ expiry }: TimeRemainingProps) => {
    const expiryDate = fromUnixTime(expiry);

    const { expired, days, hours, minutes, seconds } = useDateCountdown(expiryDate);

    if (expired) {
        return null;
    }

    if (days >= 1) {
        const ceilDays = days + Math.round(hours / 24);
        return c('Time unit').ngettext(msgid`${ceilDays} day`, `${ceilDays} days`, ceilDays);
    }

    if (hours >= 1) {
        const ceilHours = hours + Math.round(minutes / 60);
        return c('Time unit').ngettext(msgid`${ceilHours} hour`, `${ceilHours} hours`, ceilHours);
    }

    if (minutes >= 1) {
        const ceilMinutes = minutes + Math.round(seconds / 60);
        return c('Time unit').ngettext(msgid`${ceilMinutes} minute`, `${ceilMinutes} minutes`, ceilMinutes);
    }

    return c('Time unit').ngettext(msgid`${seconds} second`, `${seconds} seconds`, seconds);
};

export default TimeRemaining;
