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

/**
 * shortHumanSize makes the compact size version. That is, it rounds it to
 * zero or one kilobyte for size smaller than one kilobyte, and it drops
 * the fractional part for sizes smaller than gigabyte--only for bigger files
 * it shows one fractional digit. Examples:
 *
 * 12 bytes -> 0 KB
 * 567 bytes -> 1 KB
 * 12.34 MB -> 12 MB
 * 12.34 GB -> 12.3 GB
 */
export const shortHumanSize = (bytes = 0) => {
    if (bytes < sizeUnits.KB) {
        return humanSize(bytes, 'KB', false, 0);
    }
    if (bytes < sizeUnits.GB) {
        return humanSize(bytes, undefined, false, 0);
    }
    return humanSize(bytes, undefined, false, 1);
};

/**
 * Produces always readable version in bytes. Useful for titles where we
 * might want to display the exact size.
 */
export const bytesSize = (bytes = 0) => {
    return `${bytes} ${getSizeFormat('B', bytes)}`;
};
