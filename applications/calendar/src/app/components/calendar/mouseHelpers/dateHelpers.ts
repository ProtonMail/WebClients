import { addDays, addMinutes, startOfDay } from '@proton/shared/lib/date-fns-utc';
import { getRelativePosition } from './mathHelpers';

export const getSnappedMinutes = (minutes: number, interval: number) => {
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
