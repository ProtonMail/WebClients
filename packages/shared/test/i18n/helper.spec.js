import { c } from 'ttag';
import { format } from 'date-fns';
import cnLocale from 'date-fns/locale/zh-CN';

import dateFnLocales from '../../lib/i18n/dateFnLocales';
import { getClosestMatch } from '../../lib/i18n/helper';
import { loadDateFnLocale, loadDateFnTimeFormat } from '../../lib/i18n/dateFnLocale';
import { loadTtagLocale } from '../../lib/i18n/ttagLocale';

describe('helper', () => {
    it('should get the closest locale', () => {
        expect(getClosestMatch('en_US', { en_US: true })).toBe('en_US');
        expect(getClosestMatch('en', { en_US: true })).toBe('en_US');
        expect(getClosestMatch('sv', { en_US: true })).toBeUndefined();
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
        await loadTtagLocale({
            locale: 'fr_FR',
            language: 'fr',
            locales: { fr_FR: async () => getTranslation('Salut monique') },
        });
        expect(c('Action').t`Hey monique`).toBe('Salut monique');
    });
});

describe('Load date locales', () => {
    const zero = new Date(2000, 0, 1, 0, 0, 0);

    it('should load a fr_FR date locale if the translation exists', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'fr',
            longLocale: 'fr',
            locales: dateFnLocales,
        });
        expect(format(zero, 'iiii', { locale: dateFnLocale })).toBe('samedi');
    });

    it('should use long date format from browser and other format from locale', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'en_US',
            longLocale: 'fr',
            locales: dateFnLocales,
        });
        expect(format(zero, 'Pp', { locale: dateFnLocale })).toBe('01/01/2000, 00:00');
    });

    it('should override time format and date format with 12 hour format', async () => {
        const dateFnLocale = await loadDateFnLocale({
            locale: 'en_US',
            longLocale: 'fr',
            locales: dateFnLocales,
        });
        expect(
            format(zero, 'p', {
                locale: loadDateFnTimeFormat({
                    dateLocale: dateFnLocale,
                    displayAMPM: true,
                }),
            })
        ).toBe('12:00 AM');

        expect(
            format(zero, 'p', {
                locale: loadDateFnTimeFormat({
                    dateLocale: dateFnLocale,
                    displayAMPM: false,
                }),
            })
        ).toBe('00:00');

        expect(
            format(zero, 'p', {
                locale: loadDateFnTimeFormat({
                    dateLocale: cnLocale,
                    displayAMPM: false,
                }),
            })
        ).toBe('00:00');

        expect(
            format(zero, 'p', {
                locale: loadDateFnTimeFormat({
                    dateLocale: cnLocale,
                    displayAMPM: true,
                }),
            })
        ).toBe('上午 12:00');
    });
});
