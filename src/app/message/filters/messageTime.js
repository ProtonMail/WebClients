angular.module('proton.message')
    .filter('messageTime', () => {
        return function (time) {
            const m = moment.unix(time);

            if (m.isSame(moment(), 'day')) {
                return m.format('LT') + ' (' + m.fromNow() + ')';
            }

            return m.format('L') + ' (' + m.fromNow() + ')';
        };
    });
