import { addMinutes, addSeconds, isToday } from 'date-fns';

export const getMinScheduleTime = (date: Date) => {
    // If date is not today, there is no min time because we want to display all intervals
    if (!isToday(date)) {
        return undefined;
    }

    // Date that will be used for intervals, we don't want it to have minutes or seconds set in intervals
    // Intervals needs to be XX:00 AM/PM or XX:30 AM/PM
    const nowForInterval = new Date();
    nowForInterval.setMinutes(0, 0);

    // Current date used to get the correct min interval to display to the user
    // Limit is now date + 2 minutes
    const now = new Date();
    const limit = addSeconds(now, 120);

    // Calculate intervals
    // If it's 9:50 AM/PM, we should get
    // 9:30, 10:00, 10:30
    const nextIntervals = Array.from(Array(3)).map((_, i) => addMinutes(nowForInterval, 30 * (i + 1)));

    // Return the correct min interval to display in the time input
    // If it's 9:XX, we should get intervals 9:30, 10:00, 10:30
    // If it's 9:20 => return 9:30
    // If it's 9:55 => return 10:00
    // If it's 9:58 => return 10:30
    return limit <= nextIntervals[0]
        ? nextIntervals[0]
        : limit <= nextIntervals[1]
          ? nextIntervals[1]
          : nextIntervals[2];
};
