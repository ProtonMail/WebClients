import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { SharedURLFlags } from '../interfaces/sharing';

// eslint-disable-next-line no-control-regex
export const WINDOWS_FORBIDDEN_CHARACTERS = /[<>:"\\/|?*]|[\x00-\x1F]/g;
export const WINDOWS_RESERVED_NAMES = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
];

export const isCustomSharedURLPassword = (sharedURL: { Flags?: number }) => {
    return !!(typeof sharedURL.Flags !== 'undefined' && sharedURL.Flags & SharedURLFlags.CustomPassword);
};

export const formatLinkName = (str: string) => str.trim();

export const adjustWindowsLinkName = (fileName: string) => {
    let adjustedFileName = fileName.replaceAll(WINDOWS_FORBIDDEN_CHARACTERS, '_');

    if (WINDOWS_RESERVED_NAMES.includes(fileName.toUpperCase())) {
        adjustedFileName = `_${fileName}`;
    }

    if (adjustedFileName.endsWith('.')) {
        adjustedFileName = `${adjustedFileName.slice(0, -1)}_`;
    }

    return adjustedFileName;
};

export const adjustName = (index: number, namePart: string, extension?: string) => {
    if (index === 0) {
        return [namePart, extension].filter(isTruthy).join('.');
    }

    if (!namePart) {
        return [`.${extension}`, `(${index})`].join(' ');
    }

    const newNamePart = [namePart, `(${index})`].filter(isTruthy).join(' ');
    return [newNamePart, extension].filter(isTruthy).join('.');
};
