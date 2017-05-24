angular.module('proton.utils')
    .filter('humanSize', (CONSTANTS, gettextCatalog) => {
        const units = {
            KB: CONSTANTS.BASE_SIZE,
            MB: CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE,
            GB: CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE
        };

        const i18nSuffix = (key) => {
            const map = {
                KB: gettextCatalog.getString('KB', null, 'fileSize format'),
                MB: gettextCatalog.getString('MB', null, 'fileSize format'),
                GB: gettextCatalog.getString('GB', null, 'fileSize format')
            };

            return map[key];
        };

        function transformTo(bytes, unit, withoutUnit) {
            const value = (bytes / units[unit]).toFixed(2);
            const suffix = (withoutUnit) ? '' : ` ${i18nSuffix(unit)}`;
            return value + suffix;
        }

        return (input, withoutUnit, forceUnit) => {
            let bytes;

            if (_.isNumber(input)) {
                bytes = input;
            } else if (_.isNaN(parseInt(input, 10))) {
                bytes = 0;
            }

            if (forceUnit) {
                return transformTo(bytes, forceUnit, withoutUnit);
            }
            if (bytes < units.MB) {
                return transformTo(bytes, 'KB', withoutUnit);
            }
            if (bytes < units.GB) {
                return transformTo(bytes, 'MB', withoutUnit);
            }
            return transformTo(bytes, 'GB', withoutUnit);
        };
    });
