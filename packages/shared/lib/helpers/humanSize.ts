import { c, msgid } from 'ttag';

import { BASE_SIZE } from '../constants';

export const sizeUnits = {
    B: 1,
    KB: BASE_SIZE,
    MB: BASE_SIZE * BASE_SIZE,
    GB: BASE_SIZE * BASE_SIZE * BASE_SIZE,
};

export type SizeUnits = keyof typeof sizeUnits;

export const getSizeFormat = (key: SizeUnits, n: number) => {
    if (key === 'B') {
        return c('file size format').ngettext(msgid`byte`, `bytes`, n);
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

export const getLongSizeFormat = (key: SizeUnits, n: number) => {
    if (key === 'B') {
        return c('file size format, long').ngettext(msgid`Byte`, `Bytes`, n);
    }
    if (key === 'KB') {
        return c('file size format, long').ngettext(msgid`Kilobyte`, `Kilobytes`, n);
    }
    if (key === 'MB') {
        return c('file size format, long').ngettext(msgid`Megabyte`, `Megabytes`, n);
    }
    if (key === 'GB') {
        return c('file size format, long').ngettext(msgid`Gigabyte`, `Gigabytes`, n);
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
    const suffix = withoutUnit ? '' : ` ${getSizeFormat(unit, Number(value))}`;

    return value + suffix;
};

const humanSize = (bytes = 0, forceUnit?: SizeUnits, withoutUnit = false, maybeFractionDigits?: number) => {
    const unit = forceUnit || getUnit(bytes);
    const fractionDigits = maybeFractionDigits === undefined && unit === 'B' ? 0 : maybeFractionDigits;
    return transformTo(bytes, unit, withoutUnit, fractionDigits);
};

export default humanSize;
