angular.module('proton.utils')
    .factory('dateUtils', ($injector, gettextCatalog) => {

        const I18N = {};

        function init() {
            // Calculate a nice place holder for the input date fields. We can always change it to localize the format
            // The format is not dependend on the language, but on the locale so in that case we would have to localize
            // the parts like yyyy-mm-dd -> replace yyyy with aaaa -> replace mm with mm -> replace dd with jj for french
            // so fr-ca will still work properly.
            // We now display an e.g. <current date>
            const dateFormat = moment.localeData().longDateFormat('L');
            const year = gettextCatalog.getString('YYYY', null, 'Placeholder for YYYY in YYYY-MM-DD');
            const month = gettextCatalog.getString('MM', null, 'Placeholder for MM in YYYY-MM-DD');
            const date = gettextCatalog.getString('DD', null, 'Placeholder for DD in YYYY-MM-DD');
            const localDatePlaceholder = dateFormat.replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', date);

            I18N.days = [
                {
                    narrowLabel: gettextCatalog.getString('M', null, 'Single letter code Monday'),
                    shortLabel: gettextCatalog.getString('Mon', null, 'Three letter code Monday'),
                    longLabel: gettextCatalog.getString('Monday', null, 'Full day name'),
                    value: 1
                },
                {
                    narrowLabel: gettextCatalog.getString('T', null, 'Single letter code Tuesday'),
                    shortLabel: gettextCatalog.getString('Tue', null, 'Three letter code Tuesday'),
                    longLabel: gettextCatalog.getString('Tuesday', null, 'Full day name'),
                    value: 2
                },
                {
                    narrowLabel: gettextCatalog.getString('W', null, 'Single letter code Wednesday'),
                    shortLabel: gettextCatalog.getString('Wed', null, 'Three letter code Wednesday'),
                    longLabel: gettextCatalog.getString('Wednesday', null, 'Full day name'),
                    value: 3
                },
                {
                    narrowLabel: gettextCatalog.getString('T', null, 'Single letter code Thursday'),
                    shortLabel: gettextCatalog.getString('Thu', null, 'Three letter code Thursday'),
                    longLabel: gettextCatalog.getString('Thursday', null, 'Full day name'),
                    value: 4
                },
                {
                    narrowLabel: gettextCatalog.getString('F', null, 'Single letter code Friday'),
                    shortLabel: gettextCatalog.getString('Fri', null, 'Three letter code Friday'),
                    longLabel: gettextCatalog.getString('Friday', null, 'Full day name'),
                    value: 5
                },
                {
                    narrowLabel: gettextCatalog.getString('S', null, 'Single letter code Saturday'),
                    shortLabel: gettextCatalog.getString('Sat', null, 'Three letter code Saturday'),
                    longLabel: gettextCatalog.getString('Saturday', null, 'Full day name'),
                    value: 6
                },
                {
                    narrowLabel: gettextCatalog.getString('S', null, 'Single letter code Sunday'),
                    shortLabel: gettextCatalog.getString('Sun', null, 'Three letter code Sunday'),
                    longLabel: gettextCatalog.getString('Sunday', null, 'Full day name'),
                    value: 0
                }
            ];
            I18N.months = [
                gettextCatalog.getString('January', null, 'Pikaday'),
                gettextCatalog.getString('February', null, 'Pikaday'),
                gettextCatalog.getString('March', null, 'Pikaday'),
                gettextCatalog.getString('April', null, 'Pikaday'),
                gettextCatalog.getString('May', null, 'Pikaday'),
                gettextCatalog.getString('June', null, 'Pikaday'),
                gettextCatalog.getString('July', null, 'Pikaday'),
                gettextCatalog.getString('August', null, 'Pikaday'),
                gettextCatalog.getString('September', null, 'Pikaday'),
                gettextCatalog.getString('October', null, 'Pikaday'),
                gettextCatalog.getString('November', null, 'Pikaday'),
                gettextCatalog.getString('December', null, 'Pikaday')
            ];
            I18N.localizedDatePlaceholder = localDatePlaceholder;
        }

        /**
     The order of the week is dependent on your localisation.
     This sorts the weekday such that the chosen first day is first. (Americans start with sunday, europeans with monday, arabics with saturday).
     */
        function getSortedWeekdays() {
            const days = I18N.days.slice();
            // Get the start of the week using the locale.

            const startValue = moment.localeData().firstDayOfWeek();

            return _.sortBy(days, (day) => ((7 + day.value - startValue) % 7));
        }


        return { init, getSortedWeekdays, I18N };
    });
