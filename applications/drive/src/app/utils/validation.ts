import { c } from 'ttag';
import { MAX_NAME_LENGTH } from '../constants';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const validateLinkName = (name: string) => {
    // eslint-disable-next-line no-control-regex
    const reservedCharacters = /[<>:"\\/|?*]|[\x00-\x1F]/;
    const reservedNames = [
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
        'LPT9'
    ];

    if (!name) {
        return c('Validation Error').t`Name must not be empty`;
    }

    if (reservedCharacters.test(name)) {
        return c('Validation Error').t`Name must not contain special characters: <>:"\\/|?*`;
    }

    if (reservedNames.includes(name.toUpperCase())) {
        return c('Validation Error').t`Name must not be a system reserved name`;
    }

    if (name.length > MAX_NAME_LENGTH) {
        return c('Validation Error').t`Name must be ${MAX_NAME_LENGTH} characters long at most`;
    }

    if (name.endsWith('.')) {
        return c('Validation Error').t`Name must not end with a period`;
    }

    if (name.startsWith(' ')) {
        return c('Validation Error').t`Name must not begin with a space`;
    }

    if (name.endsWith(' ')) {
        return c('Validation Error').t`Name must not end with a space`;
    }

    return undefined;
};
