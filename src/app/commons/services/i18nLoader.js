angular.module('proton.commons')
    .factory('i18nLoader', (CONFIG, gettextCatalog) => {

        const upperCaseLocale = (locale = '') => ((locale === 'en') ? 'us' : locale).toUpperCase();
        /**
         * Format the locale to a valid format for gettext
         * {@link https://www.gnu.org/software/gettext/manual/gettext.html#Header-Entry}
         * @param  {String} locale
         * @return {String}        xx_XX
         */
        const formatLocale = (locale) => {
            const value = (locale || window.navigator.userLanguage || window.navigator.language).replace('-', '_');

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

        const load = (lang) => {
            const locale = lang || getLocale();
            gettextCatalog.debugPrefix = '';
            gettextCatalog.setCurrentLanguage(locale);
            gettextCatalog.debug = CONFIG.debug || false;
            moment.locale(locale);
            document.documentElement.lang = locale.split('_')[0];

            // If the translation is not available it seems to crash (CPU 100%)
            if (CONFIG.translations.indexOf(locale) !== -1) {
                return gettextCatalog.loadRemote(`/i18n/${locale}.json`);
            }

            return Promise.resolve();
        };

        return load;
    });
