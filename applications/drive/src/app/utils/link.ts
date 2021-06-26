import { splitExtension } from '@proton/shared/lib/helpers/file';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { SharedURLFlags } from '../interfaces/sharing';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '../constants';

export const WINDOWS_FORBIDDEN_CHARACTERS = /[<>:"|?*]/;
// eslint-disable-next-line no-control-regex
export const GLOBAL_FORBIDDEN_CHARACTERS = /\/|\\|[\u0000-\u001F]|[\u2000-\u200F]|[\u202E-\u202F]/;
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

export const isCustomSharedURLPassword = (sharedURL?: { Flags?: number }): boolean => {
    return !!(sharedURL && typeof sharedURL.Flags !== 'undefined' && sharedURL.Flags & SharedURLFlags.CustomPassword);
};

export const isGeneratedWithCustomSharedURLPassword = (sharedURL?: { Flags?: number }): boolean => {
    return !!(
        sharedURL &&
        typeof sharedURL.Flags !== 'undefined' &&
        sharedURL.Flags & SharedURLFlags.GeneratedPasswordIncluded
    );
};

export const isWithoutCustomPassword = (sharedURL?: { Flags?: number }): boolean => {
    return !isCustomSharedURLPassword(sharedURL) && !isGeneratedWithCustomSharedURLPassword(sharedURL);
};

export const splitGeneratedAndCustomPassword = (password: string, sharedURL?: { Flags?: number }): [string, string] => {
    if (isCustomSharedURLPassword(sharedURL)) {
        if (isGeneratedWithCustomSharedURLPassword(sharedURL)) {
            return [
                password.substring(0, SHARE_GENERATED_PASSWORD_LENGTH),
                password.substring(SHARE_GENERATED_PASSWORD_LENGTH),
            ];
        }
        // This is legacy custom password mode; new shares should not create it.
        return ['', password];
    }
    return [password, ''];
};

export const formatLinkName = (str: string) => str.trim();

export const splitLinkName = (linkName: string) => {
    if (linkName.endsWith('.')) {
        return [linkName, ''];
    }
    return splitExtension(linkName);
};

export const adjustWindowsLinkName = (fileName: string) => {
    let adjustedFileName = fileName.replaceAll(RegExp(WINDOWS_FORBIDDEN_CHARACTERS, 'g'), '_');

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
        return extension ? `${namePart}.${extension}` : namePart;
    }

    if (!namePart) {
        return [`.${extension}`, `(${index})`].join(' ');
    }

    const newNamePart = [namePart, `(${index})`].filter(isTruthy).join(' ');
    return [newNamePart, extension].filter(isTruthy).join('.');
};
