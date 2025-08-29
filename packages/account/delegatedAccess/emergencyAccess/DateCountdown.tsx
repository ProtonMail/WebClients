import { c, msgid } from 'ttag';

import useDateCountdown from '@proton/hooks/useDateCountdown';
import { MINUTE } from '@proton/shared/lib/constants';

export const DateCountdown = ({ date }: { date: Date }) => {
    const { days, hours, minutes } = useDateCountdown(date, { interval: MINUTE / 2 });
    if (days > 0) {
        return c('emergency_access').ngettext(msgid`${days} day left`, `${days} days left`, days);
    }
    if (hours > 0) {
        return c('emergency_access').ngettext(msgid`${hours} hour left`, `${hours} hours left`, hours);
    }
    if (minutes > 0) {
        return c('emergency_access').ngettext(msgid`${minutes} minute left`, `${minutes} minutes left`, minutes);
    }
    return c('emergency_access').t`Less than a minute left`;
};
