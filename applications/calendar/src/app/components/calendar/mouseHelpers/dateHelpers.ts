import { addDays, addMinutes, startOfDay } from '@proton/shared/lib/date-fns-utc';

import { getRelativePosition, getTargetIndex } from './mathHelpers';

const getSnappedMinutes = (minutes: number, interval: number) => {
    return Math.floor((minutes / 60) * (60 / interval)) * interval;
};

export const getSnappedDate = (date: Date, interval: number) => {
    const result = new Date(+date);
    result.setUTCMinutes(getSnappedMinutes(date.getUTCMinutes(), interval));
    return result;
};

export const getTargetMinutes = (
    pageY: number,
    top: number,
    height: number,
    totalMinutes: number,
    interval: number
) => {
    const targetMinutes = getRelativePosition(pageY, top, height) * totalMinutes;
    const hourInMinutes = Math.floor(targetMinutes / 60) * 60;
    const snappedMinutes = getSnappedMinutes(targetMinutes % 60, interval);
    return hourInMinutes + snappedMinutes;
};

export const getDiffTime = (inital: Date, diffDate: number, diffMinutes: number) => {
    return addMinutes(addDays(inital, diffDate), diffMinutes);
};

export const getNewTime = (date: Date, minutes: number) => {
    const result = startOfDay(date);
    result.setUTCMinutes(minutes);
    return result;
};

/**
 * Compute the start timestamp of the slot the mouse position points to, reusing
 * the same slot-position logic as the interactive time grid. Used by the
 * "create calendar event from mail" drop target.
 */
export const getMailDropStart = ({
    clientX,
    clientY,
    gridRect,
    days,
    interval,
}: {
    clientX: number;
    clientY: number;
    gridRect: { left: number; top: number; width: number; height: number };
    days: Date[];
    interval: number;
}): number => {
    const totalMinutes = 24 * 60;
    const targetDate = getTargetIndex(clientX, gridRect.left, gridRect.width, days.length);
    const day = days[targetDate];

    if (!day) {
        return 0;
    }

    const targetMinutes = getTargetMinutes(clientY, gridRect.top, gridRect.height, totalMinutes, interval);

    return getNewTime(day, targetMinutes).getTime();
};

/**
 * Compute the start timestamp of the slot the mouse position points to on the
 * month (day) grid. Month cells have no time axis, so a drop maps to the start
 * of the target day (00:00) and the event uses Calendar's default duration.
 */
export const getMailDropDayStart = ({
    clientX,
    clientY,
    gridRect,
    rows,
}: {
    clientX: number;
    clientY: number;
    gridRect: { left: number; top: number; width: number; height: number };
    rows: Date[][];
}): number => {
    const totalRows = rows.length;
    if (!totalRows) {
        return 0;
    }

    const targetRow = getTargetIndex(clientY, gridRect.top, gridRect.height, totalRows);
    const days = rows[targetRow];
    if (!days?.length) {
        return 0;
    }

    const targetDay = getTargetIndex(clientX, gridRect.left, gridRect.width, days.length);
    const day = days[targetDay];

    if (!day) {
        return 0;
    }

    return getNewTime(day, 0).getTime();
};
