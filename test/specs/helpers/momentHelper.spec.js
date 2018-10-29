import timezone from 'moment-timezone';

import { selectLocale } from '../../../src/helpers/momentHelper';

describe('moment helper', () => {
    let pre;

    beforeAll(() => {
        pre = window.moment;
        // Load it the same way as we do in the app.
        window.moment = timezone;
    });

    afterAll(() => {
        // Just remove whatever we set on moment after to make sure we don't pollute other tests.
        window.moment = pre;
    });

    it('should return the name of a valid locale', () => {
        const locale = moment.localeData(selectLocale('fr', 'fr'));
        expect(locale.weekdays())
            .toEqual(['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']);
    });

    const getString = () => moment.utc([2017, 1, 20, 15, 12, 14]).format('LLLL');

    it('should set American English time', () => {
        moment.locale(selectLocale('en-us', 'en-us'));
        expect(getString())
            .toEqual('Monday, February 20, 2017 3:12 PM');
    });

    it('should override 12 hour time with 24 hour time', () => {
        moment.locale(selectLocale('en-us', 'en-gb'));
        expect(getString())
            .toEqual('Monday, 20 February 2017 15:12');
    });

    it('should override 24 hour time with 12 hour time', () => {
        moment.locale(selectLocale('en-gb', 'en-us'));
        expect(getString())
            .toEqual('Monday, February 20, 2017 3:12 PM');
    });

    it('should override 24 hour time with 12 hour time in french', () => {
        moment.locale(selectLocale('fr', 'en-us'));
        expect(getString())
            .toEqual('lundi, février 20, 2017 3:12 PM');
    });

    it('should override 24 hour time with 12 hour time in a locale (norwegian) not supported', () => {
        moment.locale(selectLocale('en-us', 'nb'));
        expect(getString())
            .toEqual('Monday 20. February 2017 kl. 15:12');
    });
});
