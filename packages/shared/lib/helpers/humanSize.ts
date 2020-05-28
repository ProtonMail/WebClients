import { c } from 'ttag';

import { BASE_SIZE } from '../constants';

export type SizeUnits = 'B' | 'KB' | 'MB' | 'GB';

const units = {
    B: 1,
    KB: BASE_SIZE,
    MB: BASE_SIZE * BASE_SIZE,
    GB: BASE_SIZE * BASE_SIZE * BASE_SIZE
};

const i18nSuffix = (key: SizeUnits) => {
    const map = {
        B: c('file size format').t`bytes`,
        KB: c('file size format').t`KB`,
        MB: c('file size format').t`MB`,
        GB: c('file size format').t`GB`
    };

    return map[key];
};

const transformTo = (bytes: number, unit: SizeUnits, withoutUnit: boolean, fractionDigits = 2) => {
    const value = (bytes / units[unit]).toFixed(fractionDigits);
    const suffix = withoutUnit ? '' : ` ${i18nSuffix(unit)}`;

    return value + suffix;
};

const humanSize = (input = 0, forceUnit?: SizeUnits, withoutUnit = false) => {
    const bytes = input;

    if (forceUnit) {
        return transformTo(bytes, forceUnit, withoutUnit);
    }

    if (bytes < units.KB) {
        return transformTo(bytes, 'B', withoutUnit, 0);
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
