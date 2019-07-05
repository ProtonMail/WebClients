import { c } from 'ttag';
import { formatLocale, getLocale, localeFactory } from '../../lib/i18n';

const mockNavigator = {
    languages: null,
    language: '',
    userLanguage: ''
};

const setMockNavigator = () => {
    Object.defineProperty(window, 'navigator', { value: mockNavigator });
};

const mockFetch = (json, response) => {
    const cb = async () => ({
        json: () => json,
        status: 200,
        ...response
    });
    const spy = jasmine.createSpy('fetch').and.callFake(cb);
    global.fetch = spy;
    return spy;
};

const setBrowserLanguage = (value) => {
    mockNavigator.language = value;
};

const setBrowserLanguages = (languages = []) => {
    mockNavigator.languages = languages;
};
const setUserLanguage = (userLanguage) => {
    mockNavigator.userLanguage = userLanguage;
};

const mockTranslations = (data) => {
    const response = {
        headers: {
            'plural-forms': 'nplurals=2; plural=(n != 1);'
        },
        contexts: {
            Action: {
                'Hey monique': [data]
            }
        }
    };

    const original = c('Action').t`Hey monique`;

    return {
        response,
        test: () => ({
            original,
            expectation: data
        })
    };
};

setMockNavigator();

describe('Format the locale', () => {
    beforeEach(() => {
        setUserLanguage('');
        setBrowserLanguage('');
        setBrowserLanguages(null);
    });

    it('should extract the lang from the navigator by default', () => {
        setBrowserLanguage('es_ES');
        const locale = formatLocale();
        expect(locale).toEqual('es_ES');
    });

    it('should extract the lang set by the user', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        const locale = formatLocale();
        expect(locale).toEqual('de_DE');
    });

    it('should extract the first lang from the languages prop of the browser', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        setBrowserLanguages(['fr_FR', 'it_IT', 'en_US']);
        const locale = formatLocale();
        expect(locale).toEqual('fr_FR');
    });

    it('should get the current locale', () => {
        setBrowserLanguage('es_ES');
        setUserLanguage('de_DE');
        setBrowserLanguages(['fr_FR', 'it_IT', 'en_US']);
        const locale = formatLocale('id_ID');
        expect(locale).toEqual('id_ID');
    });
});

describe('Get the locale', () => {
    beforeEach(() => {
        setUserLanguage('');
        setBrowserLanguage('');
        setBrowserLanguages(null);
    });

    describe('No languages available inside the app', () => {
        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should return the default lang en_US', () => {
            const { browser, locale, language } = getLocale();
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });

        it('should return the default lang en_US - 2', () => {
            const { browser, locale, language } = getLocale('es_ES');
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });
    });

    describe('Languages available inside the app', () => {
        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should return the lang matching the config from the user', () => {
            const { browser, locale, language } = getLocale(null, ['es_ES']);
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('es');
            expect(locale).toEqual('es_ES');
        });

        it('should a specific lang available', () => {
            const { browser, locale, language } = getLocale('ja_JP', ['es_ES', 'ja_JP']);
            expect(browser).toEqual('es_ES');
            expect(language).toEqual('ja');
            expect(locale).toEqual('ja_JP');
        });
    });
});

describe('Load the locale', () => {
    const mockPt = mockTranslations('Si monique');
    const mockFR = mockTranslations('Wesh monique');
    const mockEn = mockTranslations('Hey monique');
    const mockIt = mockTranslations('Popopo monique');

    describe('available inside the config', () => {
        const factory = localeFactory({
            TRANSLATIONS: ['hr_HR', 'fr_FR', 'it_IT'],
            TRANSLATIONS_URL: 'settings'
        });

        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should load a translation fr_FR', async () => {
            const { test, response } = mockFR;
            mockFetch(response);

            const { browser, locale, language } = await factory('fr_FR');
            expect(global.fetch).toHaveBeenCalledWith('/settings/i18n/fr_FR.json');

            const { expectation, original } = test();
            expect(expectation).not.toEqual(original);

            expect(browser).toEqual('es_ES');
            expect(language).toEqual('fr');
            expect(locale).toEqual('fr_FR');
        });

        it('should load the same translation as the default', async () => {
            const { test, response } = mockEn;
            mockFetch(response);

            const { browser, locale, language } = await factory('en_US');
            expect(global.fetch).not.toHaveBeenCalledWith('/settings/i18n/en_US.json');

            const { expectation, original } = test();
            expect(expectation).toEqual(original);

            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });

        it('should change the document.lang', async () => {
            const { test, response } = mockIt;
            mockFetch(response);

            const { browser, locale, language } = await factory('it_IT');
            expect(global.fetch).toHaveBeenCalledWith('/settings/i18n/it_IT.json');

            const { expectation, original } = test();
            expect(expectation).not.toEqual(original);

            expect(browser).toEqual('es_ES');
            expect(language).toEqual('it');
            expect(locale).toEqual('it_IT');
            expect(document.documentElement.lang).toEqual('it');
        });
    });

    describe('not available inside the config', () => {
        const factory = localeFactory({
            TRANSLATIONS: ['hr_HR', 'it_IT']
        });

        beforeEach(() => {
            setUserLanguage('es_ES');
            setBrowserLanguage('es_ES');
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should load fallback to en_US', async () => {
            const { test, response } = mockPt;
            mockFetch(response);

            const { browser, locale, language } = await factory('pt_BR');
            expect(global.fetch).not.toHaveBeenCalledWith('/i18n/pt_BR.json');

            const { expectation, original } = test();
            expect(expectation).not.toEqual(original);

            const en = mockEn.test();
            expect(en.expectation).toEqual(en.original);

            expect(browser).toEqual('es_ES');
            expect(language).toEqual('en');
            expect(locale).toEqual('en_US');
        });
    });

    it('should be silent if there is a crash', async () => {
        const factory = localeFactory({
            TRANSLATIONS: ['ro_RO', 'it_IT']
        });
        const { test, response } = mockPt;
        mockFetch(response, {
            json: () => {
                throw new Error('Big boum badaboum');
            }
        });

        const { browser, locale, language } = await factory('ro_RO');
        expect(global.fetch).toHaveBeenCalledWith('/i18n/ro_RO.json');

        const { expectation, original } = test();
        expect(expectation).not.toEqual(original);

        const en = mockEn.test();
        expect(en.expectation).toEqual(en.original);

        expect(browser).toEqual(undefined);
        expect(language).toEqual(undefined);
        expect(locale).toEqual('ro_RO');
    });
});
