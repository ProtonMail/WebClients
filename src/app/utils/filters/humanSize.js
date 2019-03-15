import _ from 'lodash';

import { BASE_SIZE } from '../../constants';

/* @ngInject */
function humanSize(gettextCatalog, translator) {
    const units = {
        KB: BASE_SIZE,
        MB: BASE_SIZE * BASE_SIZE,
        GB: BASE_SIZE * BASE_SIZE * BASE_SIZE
    };

    const I18N = translator(() => ({
        KB: gettextCatalog.getString('KB', null, 'fileSize format'),
        MB: gettextCatalog.getString('MB', null, 'fileSize format'),
        GB: gettextCatalog.getString('GB', null, 'fileSize format')
    }));

    function transformTo(bytes, unit, withoutUnit) {
        const value = (bytes / units[unit]).toFixed(2);
        const suffix = withoutUnit ? '' : ` ${I18N[unit]}`;
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
}
export default humanSize;
