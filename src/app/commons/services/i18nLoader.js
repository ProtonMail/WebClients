import _ from 'lodash';

import CONFIG from '../../config';
import { DEFAULT_TRANSLATION } from '../../constants';
import { selectLocale, formatLocale } from '../../../helpers/momentHelper';

/* @ngInject */
function i18nLoader(dispatchers, gettextCatalog, $injector) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['i18n']);
    const dispatch = (type, data = {}) => dispatcher.i18n(type, data);

    const upperCaseLocale = (locale = '') => (locale === 'en' ? 'us' : locale).toUpperCase();

    /**
     * We expect it as fr_FR not fr-FR
     * @param {String} locale
     * @returns {string}
     */
    const getTransformedLocale = (locale = '') => {
        const changedLocale = locale.replace('-', '_');
        // OS is in French (France) => navigator.language === fr
        if (changedLocale.length === 2) {
            return `${changedLocale}_${upperCaseLocale(changedLocale)}`;
        }
        return changedLocale;
    };

    const getBrowserLocale = () => {
        // Doesn't work on IE11 ;)
        try {
            const queryParams = new window.URL(window.location).searchParams;
            return getTransformedLocale(formatLocale(queryParams.get('language')));
        } catch (e) {
            // Match: xx_XX xx-XX xx 1192
            const [, locale] = window.location.search.match(/language=(([a-z]{2,}(_|-)[A-Z]{2,})|([a-z]{2,}))/) || [];
            return getTransformedLocale(formatLocale(locale));
        }
    };

    const localizePikaday = () => {
        // Because we will lazy load these modules
        const pikadayConfiguration = $injector.get('pikadayConfiguration');

        /*
            Localize pikaday
            american days means that the translated string is in american order:
            sunday, monday, tuesday, wednesday
            This is because pikaday expects this order.
            The actual order of the days is set by the firstday parameter.
         */
        const locale = {
            previousMonth: gettextCatalog.getString('Previous Month', null, 'Pikaday'),
            nextMonth: gettextCatalog.getString('Next Month', null, 'Pikaday'),
            months: moment.months(),
            weekdays: moment.weekdays(true),
            weekdaysShort: moment.weekdaysShort(true)
        };

        pikadayConfiguration.update({
            i18n: locale,
            firstDay: moment.localeData().firstDayOfWeek(),
            format: moment.localeData().longDateFormat('L')
        });
    };

    /**
     * Localize the dates with the current translation locale and browser locale.
     */
    const localizeDate = () => {
        const { translationLocale, browserLocale } = CACHE;
        $injector.get('dateUtils').init();

        moment.locale(selectLocale(translationLocale, browserLocale));

        localizePikaday();
        dispatch('load');
    };

    /**
     * Return a matched locale if it exists in our supported translations.
     * Otherwise returns the default translation.
     * @param {String} browserLocale e.g. en_GB
     * @returns {String}
     */
    const getTranslation = (browserLocale = '') => {
        // Check if the full locale exists in the translations.
        if (CONFIG.translations.includes(browserLocale)) {
            return browserLocale;
        }

        // Try again, but only match on the language, not on the locale.
        const browserLanguage = browserLocale.substr(0, 2);
        const translationByLanguage = _.find(CONFIG.translations, (lang) => lang.substr(0, 2) === browserLanguage);
        if (translationByLanguage) {
            return translationByLanguage;
        }

        return DEFAULT_TRANSLATION;
    };

    /**
     * Load the translation library with a language.
     * Either uses the specified language in the argument, or the locale in the browser.
     * @param {String} lang
     * @returns {Promise}
     */
    const loadGettextCatalog = async (lang) => {
        const browserLocale = getBrowserLocale();

        const translationLocale = getTranslation(lang || browserLocale);
        const translationLocaleLanguage = translationLocale.substr(0, 2);

        CACHE.translationLocale = translationLocale;
        CACHE.browserLocale = browserLocale;

        gettextCatalog.debug = CONFIG.debug || false;
        gettextCatalog.debugPrefix = '';

        gettextCatalog.setCurrentLanguage(translationLocale);

        document.documentElement.lang = translationLocaleLanguage;

        // If it's the default translation, we don't need to load the json since it's loaded by default.
        if (translationLocale === DEFAULT_TRANSLATION) {
            return;
        }

        return gettextCatalog.loadRemote(`/i18n/${translationLocale}.json`);
    };

    return {
        localizeDate,
        translate: loadGettextCatalog
    };
}
export default i18nLoader;
