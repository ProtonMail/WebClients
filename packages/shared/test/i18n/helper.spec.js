import { c } from 'ttag';
import { format } from 'date-fns';
import cnLocale from 'date-fns/locale/zh-CN';

import { getClosestLocaleMatch } from '../../lib/i18n/helper';
import { getDateFnLocaleWithTimeFormat } from '../../lib/i18n/dateFnLocale';
import { loadDateLocale, loadLocale } from '../../lib/i18n/loadLocale';
import { SETTINGS_TIME_FORMAT } from '../../lib/interfaces';

describe('helper', () => {
    it('should get the closest locale', () => {
        expect(getClosestLocaleMatch('en_US', { en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('en', { en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('sv', { en_US: true })).toBeUndefined();
    });
});

const getTranslation = (data) => {
    return {
        headers: {
            'plural-forms': 'nplurals=2; plural=(n != 1);',
        },
        contexts: {
            Action: {
                'Hey monique': [data],
            },
        },
    };
};

describe('Load the locale', () => {
    it('should load a fr_FR translation', async () => {
        await loadLocale('fr_FR', { fr_FR: async () => getTranslation('Salut monique') });
        expect(c('Action').t`Hey monique`).toBe('Salut monique');
    });
});

describe('Load date locales', () => {
    const zero = new Date(2000, 0, 1, 0, 0, 0);

    it('should load a fr_FR date locale if the translation exists', async () => {
        const dateFnLocale = await loadDateLocale('fr');
        expect(format(zero, 'iiii', { locale: dateFnLocale })).toBe('samedi');
    });

    it('should use long date format from browser and other format from locale in american english', async () => {
        const dateFnLocale = await loadDateLocale('en_US', 'en_US');
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 12:00 AM');
    });

    it('should use long date format from browser and other format from locale english', async () => {
        const dateFnLocale = await loadDateLocale('en_US', 'en_GB');
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 00:00');
    });

    it('should use long date format from browser and other format from locale', async () => {
        const dateFnLocale = await loadDateLocale('en_US', 'en_US', { TimeFormat: SETTINGS_TIME_FORMAT.H24 });
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 00:00');
    });

    it('should override time format and date format with 12 hour format', async () => {
        const dateFnLocale = await loadDateLocale('en_US', 'en_US', { TimeFormat: SETTINGS_TIME_FORMAT.H24 });
        expect(format(zero, 'p', { locale: getDateFnLocaleWithTimeFormat(dateFnLocale, true) })).toBe('12:00 AM');

        expect(
            format(zero, 'p', {
                locale: getDateFnLocaleWithTimeFormat(dateFnLocale, false),
            })
        ).toBe('00:00');

        expect(
            format(zero, 'p', {
                locale: getDateFnLocaleWithTimeFormat(cnLocale, false),
            })
        ).toBe('00:00');

        expect(
            format(zero, 'p', {
                locale: getDateFnLocaleWithTimeFormat(cnLocale, true),
            })
        ).toBe('上午 12:00');
    });
});
