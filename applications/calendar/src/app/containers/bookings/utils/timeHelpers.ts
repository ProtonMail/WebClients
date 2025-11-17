import { addHours, set, setMinutes } from 'date-fns';

export const roundToNextHalfHour = (date: Date): Date => {
    const minutes = date.getMinutes();

    const normalized = set(date, {
        seconds: 0,
        milliseconds: 0,
    });

    return minutes < 30 ? setMinutes(normalized, 30) : addHours(setMinutes(normalized, 0), 1);
};
