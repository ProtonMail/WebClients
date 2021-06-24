import { c } from 'ttag';
import { format } from 'date-fns';
import cnLocale from 'date-fns/locale/zh-CN';

import { getClosestLocaleMatch, getLanguageCode } from '../../lib/i18n/helper';
import { getDateFnLocaleWithTimeFormat } from '../../lib/i18n/dateFnLocale';
import { loadDateLocale, loadLocale } from '../../lib/i18n/loadLocale';
import { SETTINGS_TIME_FORMAT } from '../../lib/interfaces';

describe('helper', () => {
    it('should get the closest locale', () => {
        expect(getClosestLocaleMatch('en_US', { en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('kab_KAB', { kab_KAB: true })).toBe('kab_KAB');
        expect(getClosestLocaleMatch('kab', { kab_KAB: true })).toBe('kab_KAB');
        expect(getClosestLocaleMatch('ka', { kab_KAB: true })).toBeUndefined();
        expect(getClosestLocaleMatch('en', { en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('sv', { en_US: true })).toBeUndefined();
        expect(getClosestLocaleMatch('en_US', { en_US: true, sv_SE: true })).toBe('en_US');
        expect(getClosestLocaleMatch('en_US', { aa_AA: true, en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('en', { aa_AA: true, en_US: true })).toBe('en_US');
        expect(getClosestLocaleMatch('fr_BE', { aa_AA: true, fr_CA: true, fr_FR: true, fr: true })).toBe('fr');
        expect(getClosestLocaleMatch('fr_BE', { aa_AA: true, fr_CA: true, fr_FR: true })).toBe('fr_FR');
        expect(getClosestLocaleMatch('fr', { aa_AA: true, fr_CA: true, fr_FR: true })).toBe('fr_FR');
    });

    it('should get the language code', () => {
        expect(getLanguageCode('en_US')).toBe('en');
        expect(getLanguageCode('kab_KAB')).toBe('kab');
        expect(getLanguageCode('sv-se')).toBe('sv');
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

    it('should keep long date format from locale and only override time', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'en_US');
        expect(format(zero, 'PPPPp', { locale: dateFnLocale })).toBe('samedi 1 janvier 2000 à 12:00 AM');
    });

    it('should keep long date format from locale', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'fr_FR');
        expect(format(zero, 'PPPPp', { locale: dateFnLocale })).toBe('samedi 1 janvier 2000 à 00:00');
    });

    it('should keep short long date format from locale', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'fr_FR');
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 00:00');
    });

    it('should keep short long date format from locale, and only override short time', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'en_US');
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 12:00 AM');
    });

    it('should keep medium long date format from locale', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'fr_FR');
        expect(format(zero, 'PPp', { locale: dateFnLocale })).toBe('1 janv. 2000, 00:00');
    });

    it('should keep medium long date format from locale, and only override short time', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'en_US');
        expect(format(zero, 'PPp', { locale: dateFnLocale })).toBe('1 janv. 2000, 12:00 AM');
    });

    it('should override medium time', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'fr_FR');
        expect(format(zero, 'PPpp', { locale: dateFnLocale })).toBe('1 janv. 2000, 00:00:00');
    });

    it('should keep medium long date format from locale, and only override medium time', async () => {
        const dateFnLocale = await loadDateLocale('fr_FR', 'en_US');
        expect(format(zero, 'PPpp', { locale: dateFnLocale })).toBe('1 janv. 2000, 12:00:00 AM');
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
