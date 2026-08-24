import { WEEK } from '../constants';
import startOfDay from './startOfDay';

const differenceInCalendarWeeks = (left: Date, right: Date) => {
    const startOfDayLeft = startOfDay(left);
    const startOfDayRight = startOfDay(right);

    const diff = startOfDayLeft.getTime() - startOfDayRight.getTime();

    return Math.floor(diff / WEEK);
};

export default differenceInCalendarWeeks;
