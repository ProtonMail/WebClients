import type { Locale } from 'date-fns';

import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { fromUTCDateToTimezone, getTimezone, getTimezoneOffset } from '@proton/shared/lib/date/timezone';

export const formatInTimeZone = (
    date: Date | number,
    timeZone: string,
    pattern: string,
    options?: { locale?: Locale }
): string => formatUTC(fromUTCDateToTimezone(new Date(date), timeZone), pattern, options);

export const isTimeZoneKnown = (timeZone: string): boolean => {
    try {
        getTimezoneOffset(new Date(), timeZone);
        return true;
    } catch {
        return false;
    }
};

export const getDeviceTimeZone = (): string => {
    const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isTimeZoneKnown(deviceTimeZone) ? deviceTimeZone : getTimezone();
};
