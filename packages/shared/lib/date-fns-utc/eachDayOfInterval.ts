import { utc } from '@date-fns/utc';
import { eachDayOfInterval as eachDayOfIntervalInZone } from 'date-fns';

/**
 * Unlike date-fns eachDayOfInterval, this throws on a reversed or invalid interval instead of returning the days in
 * reverse or an empty list.
 */
const eachDayOfInterval = (start: Date, end: Date) => {
    if (!(start.getTime() <= end.getTime())) {
        throw new RangeError('Invalid interval');
    }

    return eachDayOfIntervalInZone({ start, end }, { in: utc }).map((date) => new Date(+date));
};

export default eachDayOfInterval;
