angular.module('proton.utils')
    .filter('localReadableTime', () => {
        // January 17, 2016 12:48 pm
        return function (time) {
            const m = moment.unix(time);
            return m.format('LL h:mm A');
        };
    });
