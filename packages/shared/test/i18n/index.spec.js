import { c } from 'ttag';
import { getBrowserLocale, loadLocale } from '../../lib/i18n';

const mockNavigator = {
    languages: null,
    language: '',
    userLanguage: ''
};

const setMockNavigator = () => {
    Object.defineProperty(window, 'navigator', { value: mockNavigator });
};

const setBrowserLanguages = (languages = []) => {
    mockNavigator.languages = languages;
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
        setBrowserLanguages(null);
    });

    it('should extract the lang from the navigator by default', () => {
        setBrowserLanguages(['es_ES']);
        const locale = getBrowserLocale();
        expect(locale).toEqual('es_ES');
    });

    it('should extract the first lang from the languages prop of the browser', () => {
        setBrowserLanguages(['fr_FR', 'it_IT', 'en_US']);
        const locale = getBrowserLocale();
        expect(locale).toEqual('fr_FR');
    });
});

describe('Load the locale', () => {
    const mockFR = mockTranslations('Wesh monique');
    const mockEn = mockTranslations('Hey monique');
    const mockEs = mockTranslations('Buenos monique');

    describe('available inside the config', () => {
        beforeEach(() => {
            document.documentElement.lang = '';
            setBrowserLanguages(['es_ES', 'fr_FR']);
        });

        it('should load a translation fr_FR', async () => {
            const { test, response } = mockFR;

            await loadLocale('fr_FR', {
                fr_FR: async () => {
                    return { default: response };
                }
            });

            const { expectation, original } = test();
            expect(expectation).not.toEqual(original);
        });

        it('should load the same translation as the default', async () => {
            const { test } = mockEn;

            await loadLocale('en_US');

            const { expectation, original } = test();
            expect(expectation).toEqual(original);
        });

        it('should change the document.lang', async () => {
            const { test, response } = mockEs;

            expect(document.documentElement.lang).toEqual('');

            await loadLocale('es_ES', {
                es_ES: async () => {
                    return { default: response };
                }
            });

            const { expectation, original } = test();
            expect(expectation).not.toEqual(original);

            expect(document.documentElement.lang).toEqual('es');
        });
    });
});
