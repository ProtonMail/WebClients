import { c } from 'ttag';

import { BASE_SIZE } from '../constants';

export const sizeUnits = {
    B: 1,
    KB: BASE_SIZE,
    MB: BASE_SIZE * BASE_SIZE,
    GB: BASE_SIZE * BASE_SIZE * BASE_SIZE,
};

export type SizeUnits = keyof typeof sizeUnits;

export const getSizeFormat = (key: SizeUnits) => {
    if (key === 'B') {
        return c('file size format').t`bytes`;
    }
    if (key === 'KB') {
        return c('file size format').t`KB`;
    }
    if (key === 'MB') {
        return c('file size format').t`MB`;
    }
    if (key === 'GB') {
        return c('file size format').t`GB`;
    }
    throw new Error('Unknown unit');
};

export const getLongSizeFormat = (key: SizeUnits) => {
    if (key === 'B') {
        return c('file size format, long').t`Bytes`;
    }
    if (key === 'KB') {
        return c('file size format, long').t`Kilobytes`;
    }
    if (key === 'MB') {
        return c('file size format, long').t`Megabytes`;
    }
    if (key === 'GB') {
        return c('file size format, long').t`Gigabytes`;
    }
    throw new Error('Unknown unit');
};

export const getUnit = (bytes: number): SizeUnits => {
    if (bytes < sizeUnits.KB) {
        return 'B';
    }

    if (bytes < sizeUnits.MB) {
        return 'KB';
    }

    if (bytes < sizeUnits.GB) {
        return 'MB';
    }

    return 'GB';
};

const transformTo = (bytes: number, unit: SizeUnits, withoutUnit: boolean, fractionDigits = 2) => {
    const value = (bytes / sizeUnits[unit]).toFixed(fractionDigits);
    const suffix = withoutUnit ? '' : ` ${getSizeFormat(unit)}`;

    return value + suffix;
};

const humanSize = (bytes = 0, forceUnit?: SizeUnits, withoutUnit = false, maybeFractionDigits?: number) => {
    const unit = forceUnit || getUnit(bytes);
    const fractionDigits = maybeFractionDigits === undefined && unit === 'B' ? 0 : maybeFractionDigits;
    return transformTo(bytes, unit, withoutUnit, fractionDigits);
};

export default humanSize;
