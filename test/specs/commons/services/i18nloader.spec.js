import timezone from 'moment-timezone';
import _ from 'lodash';
import i18nService from '../../../../src/app/commons/services/i18nLoader';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import { generateModuleName } from '../../../utils/helpers';

const setBrowserLanguages = (languages = []) => {
    window.navigator.languages = languages;
};

describe('i18n loader', () => {
    const MODULE = generateModuleName();

    let defaultMoment;
    let defaultLanguage;

    beforeAll(() => {
        defaultLanguage = window.navigator.languages;
        defaultMoment = window.moment;
        window.moment = timezone;
        // Needed to be able to overwrite the native window value.
        Object.defineProperty(window.navigator, 'languages', { value: ['en'], writable: true });
    });

    afterAll(() => {
        window.moment = defaultMoment;
        window.navigator.languages = defaultLanguage;
    });

    let i18nLoader;
    let rootScope;
    const mockGettextCatalog = {
        setCurrentLanguage: _.noop,
        loadRemote: _.noop,
        getString: _.noop
    };
    const mockPikaday = {
        update: _.noop
    };
    const mockDateUtils = {
        init: _.noop
    };
    const mocks = {
        pikadayConfiguration: mockPikaday,
        dateUtils: mockDateUtils
    };
    const mockInject = {
        get: (arg) => mocks[arg]
    };

    angular.module(MODULE, []);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');

        spyOn(mockPikaday, 'update');
        spyOn(mockDateUtils, 'init');
        spyOn(mockGettextCatalog, 'setCurrentLanguage');
        spyOn(mockGettextCatalog, 'loadRemote');
        spyOn(rootScope, '$emit');
        spyOn(moment, 'localeData')
            .and
            .callThrough();

        i18nLoader = i18nService(dispatchersService(rootScope), mockGettextCatalog, mockInject);
    }));

    const expectLocale = (language, locale, loadRemote) => {
        expect(mockGettextCatalog.setCurrentLanguage)
            .toHaveBeenCalledWith(locale);

        expect(document.documentElement.lang)
            .toEqual(language);

        if (loadRemote) {
            return expect(mockGettextCatalog.loadRemote)
                .toHaveBeenCalledWith(`/i18n/${locale}.json`);
        }

        expect(mockGettextCatalog.loadRemote)
            .not
            .toHaveBeenCalled();
    };

    const expectDates = (locale) => {
        expect(moment.localeData)
            .toHaveBeenCalledWith(locale);

        expect(rootScope.$emit)
            .toHaveBeenCalledWith('i18n', { type: 'load', data: {} });
    };

    ['en', 'en_US', 'en-GB', 'en-US', 'sv', 'sv_SE', 'unsupported'].forEach((locale) => {
        it(`should load default english i18n translations on a browser set to ${locale}`, () => {
            setBrowserLanguages([locale]);

            i18nLoader.translate();

            expectLocale('en', 'en_US', false);
        });
    });

    ['fr', 'fr_FR', 'fr-FR'].forEach((locale) => {
        it(`should load french i18n translations on a browser set to ${locale}`, () => {
            setBrowserLanguages([locale]);

            i18nLoader.translate();

            expectLocale('fr', 'fr_FR', true);
        });
    });

    it('should load french i18n translations for a user who has set fr_FR', () => {
        i18nLoader.translate('fr_FR');

        expectLocale('fr', 'fr_FR', true);
    });

    it('should load french i18n translations for a user who has set fr_FR if browser is set to en_US', () => {
        setBrowserLanguages(['en_US']);

        i18nLoader.translate('fr_FR');

        expectLocale('fr', 'fr_FR', true);
    });

    it('should load i18n translations and dates for a browser to fr_FR', () => {
        setBrowserLanguages(['fr']);

        i18nLoader.translate();
        i18nLoader.localizeDate();

        expectLocale('fr', 'fr_FR', true);
        expectDates('fr_FR');
    });

    it('should load i18n translations and dates for a user who has selected fr_FR locale on a en_US browser', () => {
        setBrowserLanguages(['en_US']);

        i18nLoader.translate('fr_FR');
        i18nLoader.localizeDate();

        expect(moment.localeData.calls.argsFor(0))
            .toEqual(['en_US']);
        expect(moment.localeData.calls.argsFor(1))
            .toEqual(['fr_FR']);

        expectLocale('fr', 'fr_FR', true);
        expectDates('fr_FR');
    });
});
