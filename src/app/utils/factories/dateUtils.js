/* @ngInject */
function dateUtils($injector, gettextCatalog) {
    const I18N = {};

    const loadMoment = () => {
        // Set new relative time thresholds
        moment.relativeTimeThreshold('s', 59); // s seconds least number of seconds to be considered a minute
        moment.relativeTimeThreshold('m', 59); // m minutes least number of minutes to be considered an hour
        moment.relativeTimeThreshold('h', 23); // h hours   least number of hours to be considered a day
    };

    function init() {
        /*
            Calculate a nice place holder for the input date fields.
            We can always change it to localize the format.
            The format is not dependend on the language, but on the locale so in that case we would have to localize.
            the parts like yyyy-mm-dd:
                - replace yyyy with aaaa
                - replace mm with mm
                - replace dd with jj for french
            so fr-ca will still work properly.
            We now display an e.g. <current date>

            @todo change this placeholder to have something human friendly
         */
        const dateFormat = moment.localeData().longDateFormat('L');
        const year = gettextCatalog.getString('YYYY', null, 'Placeholder for YYYY in YYYY-MM-DD');
        const month = gettextCatalog.getString('MM', null, 'Placeholder for MM in YYYY-MM-DD');
        const date = gettextCatalog.getString('DD', null, 'Placeholder for DD in YYYY-MM-DD');
        const localDatePlaceholder = dateFormat
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', date);

        I18N.localizedDatePlaceholder = localDatePlaceholder;

        loadMoment();
    }

    /**
     * List days ordered by the locale
     * @param {String} type Type of list
     * @return {Array}
     */
    const getDays = (type) => {
        const fun = type !== 'short' ? 'weekdays' : 'weekdaysShort';

        if (!moment.localeData().firstDayOfWeek()) {
            return moment[fun](true).map((label, value) => ({ value, label }));
        }

        const [firstDay, ...days] = moment[fun]();
        const list = days.map((label, i) => ({ value: i + 1, label }));
        return list.concat([{ label: firstDay, value: 0 }]);
    };

    return { init, I18N, getDays };
}
export default dateUtils;
