import startOfDay from './startOfDay';

const MILLISECONDS_IN_DAY = 86400000;

const differenceInCalendarDays = (left: Date, right: Date) => {
    const startOfDayLeft = startOfDay(left);
    const startOfDayRight = startOfDay(right);

    const diff = startOfDayLeft.getTime() - startOfDayRight.getTime();

    return Math.round(diff / MILLISECONDS_IN_DAY);
};

export default differenceInCalendarDays;
