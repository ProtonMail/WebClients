import { addDays, addWeeks, addMonths, addYears } from '@proton/shared/lib/date-fns-utc';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

const getDateDiff = (date: Date, range: number, view: VIEWS, direction: number) => {
    switch (view) {
        case VIEWS.DAY:
            return addDays(date, direction);
        case VIEWS.WEEK:
            if (range > 0) {
                return addDays(date, direction * (1 + range));
            }
            return addWeeks(date, direction);
        case VIEWS.MONTH:
            if (range > 0) {
                return addDays(date, direction * (1 + range) * 7);
            }
            return addMonths(date, direction);
        case VIEWS.YEAR:
            return addYears(date, direction);
        case VIEWS.AGENDA:
            return addDays(date, direction);
        default:
            throw new Error('Unknown view');
    }
};

export default getDateDiff;
