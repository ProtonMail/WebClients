import { utc } from '@date-fns/utc';
import { differenceInCalendarYears as differenceInCalendarYearsInZone } from 'date-fns';

const differenceInCalendarYears = (left: Date, right: Date) =>
    differenceInCalendarYearsInZone(left, right, { in: utc });

export default differenceInCalendarYears;
