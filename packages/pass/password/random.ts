import { digitChars, lowercaseChars, specialChars, uppercaseChars } from './constants';

export type RandomPasswordOptions = {
    length: number;
    useSpecialChars: boolean;
    useDigits: boolean;
    useUppercase: boolean;
};

const resolveCharList = (options: RandomPasswordOptions): string => {
    let charList = lowercaseChars;

    if (options.useUppercase) charList = charList.concat(uppercaseChars);
    if (options.useDigits) charList = charList.concat(digitChars);
    if (options.useSpecialChars) charList = charList.concat(specialChars);

    return charList;
};

const validatePassword = (password: string, options: RandomPasswordOptions) => {
    const chars = password.split('');

    if (options.useUppercase && !chars.some((char) => uppercaseChars.includes(char))) return false;
    if (options.useDigits && !chars.some((char) => digitChars.includes(char))) return false;
    if (options.useSpecialChars && !chars.some((char) => specialChars.includes(char))) return false;

    return true;
};

export const generateRandomPassword = (options: RandomPasswordOptions, counter?: () => void): string => {
    if (options.length < 4) throw new Error('invalid password length');
    counter?.(); /* used in tests for recursion monitoring */

    const charList = resolveCharList(options);
    const randomValues = crypto.getRandomValues(new Uint8Array(options.length));

    const password = Array.from(randomValues)
        .map((val) => charList[val % charList.length])
        .join('');

    return validatePassword(password, options) ? password : generateRandomPassword(options, counter);
};
