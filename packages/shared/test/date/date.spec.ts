import { enUS, fr, it } from 'date-fns/locale';
import { getFormattedWeekdays, getFormattedMonths, getWeekStartsOn, isValidDate } from '../../lib/date/date';

describe('getFormattedWeekdays', () => {
    it('should get a list with the names of the days of the week according to current locale', () => {
        expect(getFormattedWeekdays('cccc', { locale: enUS })).toEqual([
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ]);
        expect(getFormattedWeekdays('cccc', { locale: fr })).toEqual([
            'dimanche',
            'lundi',
            'mardi',
            'mercredi',
            'jeudi',
            'vendredi',
            'samedi',
        ]);
    });
});

describe('getFormattedMonths', () => {
    it('should get a list with the names of the months of the year according to current locale', () => {
        expect(getFormattedMonths('MMMM', { locale: enUS })).toEqual([
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]);
        expect(getFormattedMonths('MMMM', { locale: fr })).toEqual([
            'janvier',
            'février',
            'mars',
            'avril',
            'mai',
            'juin',
            'juillet',
            'août',
            'septembre',
            'octobre',
            'novembre',
            'décembre',
        ]);
    });
});

describe('getWeekStartsOn', () => {
    it('should get a index from 0 (Sunday) to 6 (Saturday) of the first day of week of a given locale', () => {
        expect(getWeekStartsOn(enUS)).toEqual(0);
        expect(getWeekStartsOn(fr)).toEqual(1);
    });
});

describe('isValidDate', () => {
    it('should detect valid date', () => {
        expect(isValidDate(new Date())).toEqual(true);
    });

    it('should detect invalid date', () => {
        expect(isValidDate(new Date('panda'))).toEqual(false);
    });
});
