import _ from 'lodash';

/* @ngInject */
function i18nLoader(CONFIG, $rootScope, gettextCatalog, $injector) {
    const CACHE = {};
    const upperCaseLocale = (locale = '') => (locale === 'en' ? 'us' : locale).toUpperCase();
    const dispatch = (type, data = {}) => $rootScope.$emit('i18n', { type, data });

    /**
     * Format the locale to a valid format for gettext
     * {@link https://www.gnu.org/software/gettext/manual/gettext.html#Header-Entry}
     * @param  {String} locale
     * @return {String}        xx_XX
     */
    const formatLocale = (locale) => {
        // in this case we want to try to get the fr-CA string instead of the fr-fr string
        // the way to get this is to try to retrieve it from the window.navigator.languages.
        const firstLanguage = window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : null;
        const value = (locale || firstLanguage || window.navigator.userLanguage || window.navigator.language).replace('-', '_');

        // OS is in French (France) => navigator.language === fr
        if (value.length === 2) {
            return `${value}_${upperCaseLocale(value)}`;
        }
        return value;
    };

    const getLocale = () => {
        // Doesn't work on IE11 ;)
        try {
            const queryParams = new window.URL(window.location).searchParams;
            return formatLocale(queryParams.get('language'));
        } catch (e) {
            // Match: xx_XX xx-XX xx 1192
            const [, locale] = location.search.match(/language=(([a-z]{2,}(_|-)[A-Z]{2,})|([a-z]{2,}))/) || [];
            return formatLocale(locale);
        }
    };

    const listLocales = (lang) => {
        const navigatorLocale = getLocale();
        const locale = lang || navigatorLocale;
        const [shortLocale] = locale.split('_');
        return _.extend(CACHE, { locale, navigatorLocale, shortLocale });
    };

    const localeRanker = (navigatorLocaleData) => {
        return (localeA, localeB) => {
            const localeAData = moment.localeData(localeA);
            const localeBData = moment.localeData(localeB);

            const localeAfirstday = localeAData.firstDayOfWeek();
            const localeBfirstday = localeBData.firstDayOfWeek();
            const navigatorFirstDay = navigatorLocaleData.firstDayOfWeek();

            // first try to match the first day of week = most important
            if (localeAfirstday !== localeBfirstday && (localeAfirstday === navigatorFirstDay || localeBfirstday === navigatorFirstDay)) {
                return localeAfirstday === navigatorFirstDay ? -1 : 1;
            }

            // then try to match long date format (exact)
            const localeADateFormat = localeAData.longDateFormat('L');
            const localeBDatelformat = localeBData.longDateFormat('L');
            const navigatorDateformat = navigatorLocaleData.longDateFormat('L');

            if (
                localeADateFormat !== localeBDatelformat &&
                (localeADateFormat === navigatorDateformat || localeBDatelformat === navigatorDateformat)
            ) {
                return localeADateFormat === navigatorDateformat ? -1 : 1;
            }

            // maybe match them without symbols?
            const woSymbols = (str) => str.replace(/[^a-zA-Z]/g, '');
            const localeAStrippedFormat = woSymbols(localeADateFormat);
            const localeBStrippedFormat = woSymbols(localeBDatelformat);
            const navigatorStrippedFormat = woSymbols(navigatorDateformat);

            if (
                localeAStrippedFormat !== localeBStrippedFormat &&
                (localeAStrippedFormat === navigatorStrippedFormat || localeBStrippedFormat === navigatorStrippedFormat)
            ) {
                return localeAStrippedFormat === navigatorStrippedFormat ? -1 : 1;
            }

            // promote en_gb as it's more common than australian
            if (localeA === 'en-gb' || localeB === 'en-gb') {
                return localeA === 'en-gb' ? -1 : 1;
            }

            return localeA.length - localeB.length;
        };
    };

    const selectLocale = (baseLocale, navigatorLocale = formatLocale()) => {
        // select one of the locales that have the same language as the base locale
        // and has the same settings as the navigator locale.

        const navigatorLocaleData = moment.localeData(navigatorLocale);
        const normalizedNavLocale = navigatorLocale.toLowerCase().replace('_', '-');

        if (navigatorLocaleData !== null) {
            const possibleLocales = moment.locales().filter((val) => val.lastIndexOf(baseLocale, 0) === 0);

            possibleLocales.sort(localeRanker(navigatorLocaleData));

            // chose the navigator locale if possible
            if (_.includes(possibleLocales, normalizedNavLocale)) {
                return normalizedNavLocale;
            }
            if (possibleLocales.length) {
                return possibleLocales[0];
            }
        }
        return baseLocale;
    };

    const localizePikaday = () => {
        // Because we will lazy load these modules
        const dateUtils = $injector.get('dateUtils');
        const pikadayConfiguration = $injector.get('pikadayConfiguration');

        /*
            Localize pikaday
            american days means that the translated string is in american order:
            sunday, monday, tuesday, wednesday
            This is because pikaday expects this order.
            The actual order of the days is set by the firstday parameter.
         */
        const americanDays = _.sortBy(dateUtils.I18N.days.slice(), (day) => day.value);
        const locale = {
            previousMonth: gettextCatalog.getString('Previous Month', null, 'Pikaday'),
            nextMonth: gettextCatalog.getString('Next Month', null, 'Pikaday'),
            months: dateUtils.I18N.months,
            weekdays: americanDays.map((day) => day.longLabel),
            weekdaysShort: americanDays.map((day) => day.shortLabel)
        };

        pikadayConfiguration.update({
            i18n: locale,
            firstDay: moment.localeData().firstDayOfWeek(),
            format: moment.localeData().longDateFormat('L')
        });
    };

    const localizeDate = async () => {
        const { navigatorLocale, shortLocale } = CACHE;
        $injector.get('dateUtils').init();

        /**
         * We want to use a more specific locale because a language isn't directly connect to a language:
         * e.g. English is used by U.S./Canada and U.K. but U.S./Canada use Sunday as the first day and
         * the U.K. uses Monday.
         * It's also better if you consider that all untranslated languages use English.
         * moment.localeData() uses the selected language in the interface.
         * Note that this doesn't only apply to the English language, the same occurs when considering:
         * French-Canada and France (Both French but: Sunday/Monday);
         * Brazil and Portugal (Both Portuguese but: Sunday/Monday);
         * Spain and Hispanic-America (Both Spanish but: Sunday/Monday);
         * Iraq, Saudi-Arabia and Morocco (Both Arabic but: Saturday/Sunday/Monday).
         */
        moment.locale(selectLocale(shortLocale, navigatorLocale));

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
