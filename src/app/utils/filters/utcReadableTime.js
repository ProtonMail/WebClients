angular.module('proton.utils')
    .filter('utcReadableTime', () => {
        // January 17, 2016 8:48 PM
        return function (time) {
            const m = moment.unix(time);
            return m.utc().format('LL LT');
        };
    });
