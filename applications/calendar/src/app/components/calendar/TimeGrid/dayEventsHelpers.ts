import { isNextDay } from '@proton/shared/lib/date-fns-utc';

/**
 * Compute event "duration" in the UI. If an event is split in 2 days in the UI,
 * return the duration of the part passed in the arguments.
 */
export const getEventPartDuration = ({ start, end, colEnd }: { start: Date; end: Date; colEnd: number }) => {
    const eventPartEnd = new Date(end);
    const eventPartStart = new Date(start);

    if (isNextDay(start, end)) {
        // The event part ends at the end of the day
        if (colEnd === 24 * 60) {
            eventPartEnd.setUTCHours(0, 0, 0, 0);
        } else {
            eventPartStart.setUTCDate(end.getUTCDate());
            eventPartStart.setUTCHours(0, 0, 0, 0);
        }
    }

    return +eventPartEnd - +eventPartStart;
};
