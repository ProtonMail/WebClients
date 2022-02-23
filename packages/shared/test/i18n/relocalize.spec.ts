import { format } from 'date-fns';
import { c, LocaleData, useLocale as ttagUseLocale } from 'ttag';
import { DEFAULT_LOCALE } from '../../lib/constants';
import { dateLocale } from '../../lib/i18n';
import { loadDateLocale, loadLocale } from '../../lib/i18n/loadLocale';
import { setLocales } from '../../lib/i18n/locales';
import { relocalizeText } from '../../lib/i18n/relocalize';
import { UserSettings } from '../../lib/interfaces';

const dummyUserSettings: UserSettings = {
    AppWelcome: {},
    Email: {
        Value: 'test',
        Status: 0,
        Notify: 0,
        Reset: 0,
    },
    Phone: {
        Value: 'test',
        Status: 0,
        Notify: 0,
        Reset: 0,
    },
    Password: {
        Mode: 2,
        ExpirationTime: 0,
    },
    '2FA': {
        Enabled: 1,
        Allowed: 1,
        ExpirationTime: 0,
        U2FKeys: [
            {
                Label: 'test',
                KeyHandle: 'test',
                Compromised: 0,
            },
        ],
    },
    News: 0,
    Locale: 'en_US',
    LogAuth: 1,
    InvoiceText: 0,
    Density: 0,
    Theme: 'test',
    ThemeType: 1,
    WeekStart: 1,
    DateFormat: 1,
    TimeFormat: 1,
    Welcome: 0,
    EarlyAccess: 1,
    Flags: { Welcomed: 0 },
    Referral: {
        Eligible: false,
        Link: '',
    },
};

const getTranslation = (data: string) => {
    return {
        headers: {
            'plural-forms': 'nplurals=2; plural=(n != 1);',
        },
        contexts: {
            Info: {
                'This is not a pipe': [data],
            },
        },
    } as unknown as LocaleData; // the LocaleData type is wrong.
};
const getTranslationWithDate = (data: string) => {
    return {
        headers: {
            'plural-forms': 'nplurals=2; plural=(n != 1);',
        },
        contexts: {
            Info: {
                // eslint-disable-next-line no-template-curly-in-string
                'December 16th 2021 was a ${ formattedDate }': [data],
            },
        },
    } as unknown as LocaleData; // the LocaleData type is wrong.
};
const getLocalizedText = () => c('Info').t`This is not a pipe`;
const getLocalizedTextWithDate = () => {
    const formattedDate = format(new Date(2021, 11, 16), 'cccc', { locale: dateLocale });
    return c('Info').t`December 16th 2021 was a ${formattedDate}`;
};

describe('relocalizeText', () => {
    afterEach(() => {
        setLocales({});
        ttagUseLocale(DEFAULT_LOCALE);
        void loadDateLocale(DEFAULT_LOCALE);
    });

    it('should localize to a different locale only inside the relocalizeText context', async () => {
        const locales = {
            fr_FR: async () => getTranslation("Ceci n'est pas une pipe"),
            it_IT: async () => getTranslation('Questa non è una pipa'),
        };
        setLocales(locales);
        await loadLocale('fr_FR', locales);
        expect(
            await relocalizeText({
                getLocalizedText,
                newLocaleCode: 'it_IT',
                userSettings: dummyUserSettings,
            })
        ).toEqual('Questa non è una pipa');
        expect(getLocalizedText()).toEqual("Ceci n'est pas une pipe");
    });

    it('should not try to load the default locale', async () => {
        const locales = {
            fr_FR: async () => getTranslation("Ceci n'est pas une pipe"),
            it_IT: async () => getTranslation('Questa non è una pipa'),
        };
        setLocales(locales);
        await loadLocale('fr_FR', locales);
        expect(
            await relocalizeText({
                getLocalizedText,
                newLocaleCode: DEFAULT_LOCALE,
                userSettings: dummyUserSettings,
            })
        ).toEqual('This is not a pipe');
        // notice that if relocalizeText tried to load the default locale, it would fail
        // and fall in the next test (fallback to current locale if the locale passed has no data)
    });

    it('should fallback to the current locale if the locale passed has no data', async () => {
        const locales = {
            fr_FR: async () => getTranslation("Ceci n'est pas une pipe"),
            it_IT: async () => getTranslation('Questa non è una pipa'),
            gl_ES: undefined,
        };
        setLocales(locales);
        await loadLocale('fr_FR', locales);
        expect(
            await relocalizeText({
                getLocalizedText,
                newLocaleCode: 'gl_ES',
                userSettings: dummyUserSettings,
            })
        ).toEqual("Ceci n'est pas une pipe");
        expect(getLocalizedText()).toEqual("Ceci n'est pas une pipe");
    });

    it('should fallback to the current locale if no locale is passed', async () => {
        expect(
            await relocalizeText({
                getLocalizedText,
                userSettings: dummyUserSettings,
            })
        ).toEqual('This is not a pipe');
    });

    it('should relocalize without date format', async () => {
        setLocales({
            // eslint-disable-next-line no-template-curly-in-string
            es_ES: async () => getTranslationWithDate('El 16 de diciembre de 2021 fue un ${ formattedDate }'),
        });
        expect(
            await relocalizeText({
                getLocalizedText: getLocalizedTextWithDate,
                newLocaleCode: 'es_ES',
                userSettings: dummyUserSettings,
            })
        ).toEqual('El 16 de diciembre de 2021 fue un Thursday');
    });

    it('should relocalize with date format', async () => {
        setLocales({
            // eslint-disable-next-line no-template-curly-in-string
            es_ES: async () => getTranslationWithDate('El 16 de diciembre de 2021 fue un ${ formattedDate }'),
        });
        await loadDateLocale('es_ES', 'es_ES');
        expect(
            await relocalizeText({
                getLocalizedText: getLocalizedTextWithDate,
                newLocaleCode: 'es_ES',
                relocalizeDateFormat: true,
                userSettings: dummyUserSettings,
            })
        ).toEqual('El 16 de diciembre de 2021 fue un jueves');
    });

    it('should fallback to current date locale if no date locale data is found', async () => {
        setLocales({
            // eslint-disable-next-line no-template-curly-in-string
            xx_XX: async () => getTranslationWithDate('blah blah blah ${ formattedDate }'),
        });
        expect(
            await relocalizeText({
                getLocalizedText: getLocalizedTextWithDate,
                newLocaleCode: 'xx_XX',
                relocalizeDateFormat: true,
                userSettings: dummyUserSettings,
            })
        ).toEqual('blah blah blah Thursday');
    });
});
