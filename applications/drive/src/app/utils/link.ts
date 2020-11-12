import { SharedURLFlags } from '../interfaces/sharing';

export const isCustomSharedURLPassword = (sharedURL: { Flags?: number }) => {
    return !!(typeof sharedURL.Flags !== 'undefined' && sharedURL.Flags & SharedURLFlags.CustomPassword);
};

export const formatLinkName = (str: string) => str.trim();

export const adjustWindowsFileName = (fileName: string) => {
    // eslint-disable-next-line no-control-regex
    const RESERVED_CHARACTERS = /[<>:"\\/|?*]|[\x00-\x1F]/;
    const RESERVED_NAMES = [
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

    let adjustedFileName = fileName.replaceAll(RESERVED_CHARACTERS, '_');

    if (RESERVED_NAMES.includes(fileName.toUpperCase())) {
        adjustedFileName = `_${fileName}`;
    }

    if (adjustedFileName.endsWith('.')) {
        adjustedFileName = `${adjustedFileName.slice(-1)}_`;
    }

    return adjustedFileName;
};
