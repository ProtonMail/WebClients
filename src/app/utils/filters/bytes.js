angular.module('proton.utils')
    .filter('bytes', (CONSTANTS) => {
        const KB = CONSTANTS.BASE_SIZE;
        const UNITS = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        return (bytes, precision = 1) => {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes) || bytes === 0) {
                return '-';
            }
            const number = Math.floor(Math.log(bytes) / Math.log(KB));
            const digits = (number === 0) ? 0 : precision;
            const value = (bytes / Math.pow(KB, Math.floor(number))).toFixed(digits);
            return `${value} ${UNITS[number]}`;
        };
    });
