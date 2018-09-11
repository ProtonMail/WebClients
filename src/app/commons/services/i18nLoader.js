import _ from 'lodash';

import CONFIG from '../../config';
import { selectLocale, formatLocale } from '../../../helpers/momentHelper';

/* @ngInject */
function i18nLoader(dispatchers, gettextCatalog, $injector) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['i18n']);
    const dispatch = (type, data = {}) => dispatcher.i18n(type, data);

    const getLocale = () => {
        // Doesn't work on IE11 ;)
        try {
            const queryParams = new window.URL(window.location).searchParams;
            return formatLocale(queryParams.get('language'));
        } catch (e) {
            // Match: xx_XX xx-XX xx 1192
            const [, locale] = window.location.search.match(/language=(([a-z]{2,}(_|-)[A-Z]{2,})|([a-z]{2,}))/) || [];
            return formatLocale(locale);
        }
    };

    const listLocales = (lang) => {
        const navigatorLocale = getLocale();
        const locale = lang || navigatorLocale;
        const [shortLocale] = locale.split('_');
        return _.extend(CACHE, { locale, navigatorLocale, shortLocale });
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

    const localizeDate = async () => {
        const { locale, navigatorLocale } = CACHE;
        $injector.get('dateUtils').init();

        moment.locale(selectLocale(locale, navigatorLocale));

        localizePikaday();
        CACHE.langCountry = moment.locale();
        dispatch('load', { lang: CACHE.langCountry });
    };

    const loadGettextCatalog = async (lang) => {
        const { locale, shortLocale } = listLocales(lang);

        gettextCatalog.debugPrefix = '';
        gettextCatalog.setCurrentLanguage(locale);
        gettextCatalog.debug = CONFIG.debug || false;

        document.documentElement.lang = shortLocale;

        if (locale.startsWith('en')) {
            return;
        }

        // If the translation is not available it seems to crash (CPU 100%)
        if (CONFIG.translations.includes(locale)) {
            return gettextCatalog.loadRemote(`/i18n/${locale}.json`);
        }

        // Try again, but only match on the language, not on the locale.
        const languageMatch = _.find(CONFIG.translations, (lang) => lang.substr(0, 2) === shortLocale);
        if (languageMatch) {
            return gettextCatalog.loadRemote(`/i18n/${languageMatch}.json`);
        }
    };

    return {
        localizeDate,
        translate: loadGettextCatalog,
        langCountry: CACHE.langCountry
    };
}
export default i18nLoader;
