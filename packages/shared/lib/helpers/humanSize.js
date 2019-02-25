import { c } from 'ttag';

import { BASE_SIZE } from '../constants';

const units = {
    KB: BASE_SIZE,
    MB: BASE_SIZE * BASE_SIZE,
    GB: BASE_SIZE * BASE_SIZE * BASE_SIZE
};

const i18nSuffix = (key) => {
    const map = {
        KB: c('file size format').t`KB`,
        MB: c('file size format').t`MB`,
        GB: c('file size format').t`GB`
    };

    return map[key];
};

const transformTo = (bytes, unit, withoutUnit) => {
    const value = (bytes / units[unit]).toFixed(2);
    const suffix = withoutUnit ? '' : ` ${i18nSuffix(unit)}`;

    return value + suffix;
};

const humanSize = (input = 0, forceUnit = false, withoutUnit = false) => {
    let bytes;

    if (typeof input === 'number') {
        bytes = input;
    } else if (isNaN(parseInt(input, 10))) {
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


export default humanSize;
