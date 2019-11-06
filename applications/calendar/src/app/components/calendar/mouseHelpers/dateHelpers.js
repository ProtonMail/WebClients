import { addDays, addMinutes, startOfDay } from 'proton-shared/lib/date-fns-utc';
import { getRelativePosition } from './mathHelpers';

export const getSnappedMinutes = (minutes, interval) => {
    return Math.floor((minutes / 60) * (60 / interval)) * interval;
};

export const getSnappedDate = (date, interval) => {
    const result = new Date(+date);
    result.setUTCMinutes(getSnappedMinutes(date.getUTCMinutes(), interval));
    return result;
};

export const getTargetMinutes = (pageY, top, height, totalMinutes, interval) => {
    const targetMinutes = getRelativePosition(pageY, top, height) * totalMinutes;
    const hourInMinutes = Math.floor(targetMinutes / 60) * 60;
    const snappedMinutes = getSnappedMinutes(targetMinutes % 60, interval);
    return hourInMinutes + snappedMinutes;
};

export const getDiffTime = (inital, diffDate, diffMinutes) => {
    return addMinutes(addDays(inital, diffDate), diffMinutes);
};

export const getNewTime = (date, minutes) => {
    const result = startOfDay(date);
    result.setUTCMinutes(minutes);
    return result;
};
