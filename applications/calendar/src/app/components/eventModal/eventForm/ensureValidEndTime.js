import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTimeState, getTimeInUtc } from './time';

const ensureValidEndTime = (data) => {
    const { start, end } = data;

    const startUtcDate = getTimeInUtc(start);
    const endUtcDate = getTimeInUtc(end);

    if (startUtcDate > endUtcDate) {
        const endLocalDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), end.tzid));

        return {
            start,
            end: getDateTimeState(endLocalDate, end.tzid)
        };
    }

    return data;
};

export default ensureValidEndTime;
