angular.module('proton.utils')
    .filter('longReadableTime', () => {
        // 1/17/2016 12:48 PM
        return function (time) {
            const m = moment.unix(time);

            if (m.isSame(moment(), 'day')) {
                if (m.isSame(moment(), 'hour')) {
                    return m.fromNow();
                }
                return m.format('LT');
            }

            return m.format('l LT');
        };
    });
