/* @ngInject */
function delay(gettextCatalog) {
    return function(input) {
        // get the current moment
        const now = moment();
        let then = moment.unix(input);

        if (then.isAfter(now)) {
            // get the difference from now to then in ms
            let ms = then.diff(now, 'milliseconds', true);

            // update the duration in ms
            ms = then.diff(now, 'milliseconds', true);
            const days = Math.floor(moment.duration(ms).asDays());

            then = then.subtract(days, 'days');
            // update the duration in ms
            ms = then.diff(now, 'milliseconds', true);
            const hours = Math.floor(moment.duration(ms).asHours());

            then = then.subtract(hours, 'hours');
            // update the duration in ms
            ms = then.diff(now, 'milliseconds', true);
            const minutes = Math.floor(moment.duration(ms).asMinutes());

            then = then.subtract(minutes, 'minutes');
            // update the duration in ms
            ms = then.diff(now, 'milliseconds', true);
            const seconds = Math.floor(moment.duration(ms).asSeconds());

            // concatonate the variables
            return (
                days +
                ' ' +
                gettextCatalog.getString('Days', null, 'Delay') +
                ' ' +
                hours +
                ' ' +
                gettextCatalog.getString('Hours', null, 'Delay') +
                ' ' +
                minutes +
                ' ' +
                gettextCatalog.getString('Minutes', null, 'Delay') +
                ' ' +
                seconds +
                ' ' +
                gettextCatalog.getString('Seconds', null, 'Delay')
            );
        }

        return '';
    };
}
export default delay;
