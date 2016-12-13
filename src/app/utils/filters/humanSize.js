angular.module('proton.utils')
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
    });
