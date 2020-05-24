import { enUS, fr } from 'date-fns/locale';
import { getFormattedWeekdays, getFormattedMonths, getWeekStartsOn } from '../../lib/date/date';

describe('getFormattedWeekdays', () => {
    it('should get a list with the names of the days of the week according to current locale', () => {
        expect(getFormattedWeekdays('cccc', { locale: enUS })).toEqual([
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ]);
        expect(getFormattedWeekdays('cccc', { locale: fr })).toEqual([
            'dimanche',
            'lundi',
            'mardi',
            'mercredi',
            'jeudi',
            'vendredi',
            'samedi'
        ]);
        expect(getFormattedWeekdays('cccc', { locale: fr, weekStartsOn: 1 })).toEqual([
            'dimanche',
            'lundi',
            'mardi',
            'mercredi',
            'jeudi',
            'vendredi',
            'samedi'
        ]);
    });
});

describe('getFormattedMonths', () => {
    it('should get a list with the names of the days of the week according to current locale', () => {
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
            'December'
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
            'décembre'
        ]);
    });
});

describe('getWeekStartsOn', () => {
    it('should get a list with the names of the days of the week according to current locale', () => {
        expect(getWeekStartsOn(enUS)).toEqual(0);
        expect(getWeekStartsOn(fr)).toEqual(1);
    });
});
