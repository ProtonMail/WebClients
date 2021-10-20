import { fromUnixTime } from 'date-fns';

import { convertUTCDateTimeToZone, fromUTCDate } from '../date/timezone';

const utcTimestampToTimezone = (unixTime: number, timezone: string) => {
    return convertUTCDateTimeToZone(fromUTCDate(fromUnixTime(unixTime)), timezone);
};

export default utcTimestampToTimezone;
