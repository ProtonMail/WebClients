angular.module('proton.filters')

.filter('delay', (gettextCatalog) => {
    return function (input) {
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
            return days + ' ' + gettextCatalog.getString('Days') + ' ' + hours + ' ' + gettextCatalog.getString('Hours') + ' ' + minutes + ' ' + gettextCatalog.getString('Minutes') + ' ' + seconds + ' ' + gettextCatalog.getString('Seconds', null);
        }

        return '';
    };
})

.filter('reverse', () => {
    return function (value) {
        if (angular.isArray(value)) {
            return value.reverse();
        }
        return [];
    };
})

.filter('capitalize', () => {
    return function (value = '') {

        if (value) {
            return angular.uppercase(value).substring(0, 1) + angular.lowercase(value).substring(1);
        }

        return value;
    };
})

.filter('fixed', () => {
    return function (input, number) {
        return input.toFixed(number || 2);
    };
})

.filter('number', () => {
    return function (input, places) {
        if (isNaN(input)) {
            return input;
        }
        // If we want 1 decimal place, we want to mult/div by 10
        // If we want 2 decimal places, we want to mult/div by 100, etc
        // So use the following to create that factor
        const factor = '1' + Array(+(places > 0 && places + 1)).join('0');

        return Math.round(input * factor) / factor;
    };
})

.filter('labels', (authentication, $rootScope) => {
    let cache = [];
    const updateCache = () => {
        cache = _.sortBy(authentication.user.Labels, 'Order');
    };

    $rootScope.$on('deleteLabel', () => updateCache());
    $rootScope.$on('createLabel', () => updateCache());
    $rootScope.$on('updateLabel', () => updateCache());
    $rootScope.$on('updateLabels', () => updateCache());
    return (labels = []) => {
        if (authentication.user) {
            (!cache.length) && updateCache();
            return _.filter(cache, ({ ID }) => labels.some((id) => id === ID));
        }

        return [];
    };
})

/* Returns boolean */
.filter('showLabels', (authentication) => {
    return function (labels) {
        const labelsFiltered = [];
        const currentLabels = _.map(authentication.user.Labels, (label) => {
            return label.ID;
        });
        console.trace('LOL');

        _.each(labels, (label) => {
            let value = label;

            if (angular.isObject(label)) {
                value = label.ID;
            }

            if (currentLabels.indexOf(value) !== -1) {
                labelsFiltered.push(label);
            }
        });

        return labelsFiltered.length > 0 ? 1 : 0;
    };
})

.filter('currency', () => {
    return function (amount, currency) {
        let result;

        switch (currency) {
            case 'EUR':
                result = amount + ' €';
                break;
            case 'CHF':
                result = amount + ' CHF';
                break;
            case 'USD':
                if (amount < 0) {
                    result = '-$' + Math.abs(amount); // Transform negative number to positive
                } else {
                    result = '$' + amount;
                }
                break;
            default:
                break;
        }

        return result;
    };
})


// Jan 17, 2016
.filter('readableTime', () => {
    return function (time) {
        const m = moment.unix(time);

        if (m.isSame(moment(), 'day')) {
            return m.format('LT');
        }

        return m.format('ll');
    };
})

// January 17, 2016 8:48 PM
.filter('utcReadableTime', () => {
    return function (time) {
        const m = moment.unix(time);

        return m.utc().format('LL LT');
    };
})

// January 17, 2016 12:48 pm
.filter('localReadableTime', () => {
    return function (time) {
        const m = moment.unix(time);

        return m.format('LL h:mm A');
    };
})

// 1/17/2016 12:48 PM
.filter('longReadableTime', () => {
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
})

.filter('displayName', () => {
    return function (input) {
        const value = input || '';

        if (value) {
            /* eslint no-useless-escape: "off" */
            return value.replace(/</g, '').replace(/>/g, '').replace(/\@/g, '');
        }

        return value;
    };
})

// unused
.filter('purify', ($sce) => {
    return function (value) {
        return $sce.trustAsHtml(value);
    };
})

.filter('humanDuration', () => {
    return function (input, units) {
        const duration = moment.duration(Math.round(input), units);
        const days = duration.days();
        const cmps = [];
        if (days === 1) {
            cmps.push('a day');
        } else if (days > 1) {
            cmps.push(days + ' days');
        }

        duration.subtract(days, 'days');
        const hours = duration.hours();
        if (hours === 1) {
            cmps.push('an hour');
        } else if (hours > 1) {
            cmps.push(hours + ' hours');
        }
        return cmps.join(' and ');
    };
})

.filter('humanSize', (CONSTANTS) => {
    return function (input, withoutUnit) {
        let bytes;
        let unit = '';
        const kb = CONSTANTS.BASE_SIZE;
        const mb = kb * kb;
        const gb = mb * kb;

        if (_.isNumber(input)) {
            bytes = input;
        } else if (_.isNaN(parseInt(input, 10))) {
            bytes = 0;
        }

        if (bytes < mb) {
            if (!withoutUnit) {
                unit = ' KB';
            }
            return (bytes / kb).toFixed(1) + unit;
        } else if (bytes < gb) {
            if (!withoutUnit) {
                unit = ' MB';
            }
            return (bytes / kb / kb).toFixed(2) + unit;
        }

        if (!withoutUnit) {
            unit = ' GB';
        }
        return (bytes / kb / kb / kb).toFixed(2) + unit;
    };
})

.filter('bytes', () => {
    return function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes) || bytes === 0) {
            return '-';
        }

        const kb = 1000;
        const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        const number = Math.floor(Math.log(bytes) / Math.log(kb));

        const padding = (typeof precision === 'undefined') ? 1 : precision;

        return (bytes / Math.pow(kb, Math.floor(number))).toFixed(padding) + ' ' + units[number];
    };
})



.filter('range', () => {
    return function (val, range) {
        /* eslint no-param-reassign: "off" */
        return (val = _.range(parseInt(range, 10)));
    };
});
