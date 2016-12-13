angular.module('proton.utils')
    .filter('bytes', () => {
        const KB = 1000;
        const UNITS = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        return function (bytes, precision = 1) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes) || bytes === 0) {
                return '-';
            }
            const number = Math.floor(Math.log(bytes) / Math.log(KB));
            const value = (bytes / Math.pow(KB, Math.floor(number))).toFixed(precision);
            return `${value} ${UNITS[number]}`;
        };
    });
