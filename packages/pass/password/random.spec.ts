import { specialChars } from './constants';
import type { RandomPasswordOptions } from './random';
import { generateRandomPassword } from './random';

const passwordMatchesOptions = (password: string, options: RandomPasswordOptions) => {
    const validLength = password.length === options.length;
    const validUppercase = !options.useUppercase || /[A-Z]/.test(password);
    const validDigits = !options.useDigits || /[0-9]/.test(password);
    const validSpecialChars =
        !options.useSpecialChars ||
        new RegExp(
            specialChars
                .split('')
                .map((char) => (specialChars.includes(char) ? `\\${char}` : char))
                .join('|')
        ).test(password);

    return validLength && validUppercase && validDigits && validSpecialChars;
};

describe('random password generator', () => {
    test('should throw if password length is smaller than 4', () => {
        expect(() =>
            generateRandomPassword({
                length: 3,
                useDigits: true,
                useSpecialChars: true,
                useUppercase: true,
            })
        ).toThrow();

        expect(() =>
            generateRandomPassword({
                length: 0,
                useDigits: true,
                useSpecialChars: true,
                useUppercase: true,
            })
        ).toThrow();
    });

    test('supports lowercase mode', () => {
        const options: RandomPasswordOptions[] = [
            { length: 4, useDigits: false, useSpecialChars: false, useUppercase: false },
            { length: 5, useDigits: false, useSpecialChars: false, useUppercase: false },
            { length: 10, useDigits: false, useSpecialChars: false, useUppercase: false },
            { length: 15, useDigits: false, useSpecialChars: false, useUppercase: false },
            { length: 20, useDigits: false, useSpecialChars: false, useUppercase: false },
        ];

        options.forEach((option) => expect(passwordMatchesOptions(generateRandomPassword(option), option)).toBe(true));
    });

    test('supports uppercase mode', () => {
        const options: RandomPasswordOptions[] = [
            { length: 4, useDigits: false, useSpecialChars: false, useUppercase: true },
            { length: 5, useDigits: false, useSpecialChars: false, useUppercase: true },
            { length: 10, useDigits: false, useSpecialChars: false, useUppercase: true },
            { length: 15, useDigits: false, useSpecialChars: false, useUppercase: true },
            { length: 20, useDigits: false, useSpecialChars: false, useUppercase: true },
        ];

        options.forEach((option) => expect(passwordMatchesOptions(generateRandomPassword(option), option)).toBe(true));
    });

    test('supports digits mode', () => {
        const options: RandomPasswordOptions[] = [
            { length: 4, useDigits: true, useSpecialChars: false, useUppercase: false },
            { length: 5, useDigits: true, useSpecialChars: false, useUppercase: false },
            { length: 10, useDigits: true, useSpecialChars: false, useUppercase: false },
            { length: 15, useDigits: true, useSpecialChars: false, useUppercase: false },
            { length: 20, useDigits: true, useSpecialChars: false, useUppercase: false },
        ];

        options.forEach((option) => expect(passwordMatchesOptions(generateRandomPassword(option), option)).toBe(true));
    });

    test('supports special mode', () => {
        const options: RandomPasswordOptions[] = [
            { length: 4, useDigits: false, useSpecialChars: true, useUppercase: false },
            { length: 5, useDigits: false, useSpecialChars: true, useUppercase: false },
            { length: 10, useDigits: false, useSpecialChars: true, useUppercase: false },
            { length: 15, useDigits: false, useSpecialChars: true, useUppercase: false },
            { length: 20, useDigits: false, useSpecialChars: true, useUppercase: false },
        ];

        options.forEach((option) => expect(passwordMatchesOptions(generateRandomPassword(option), option)).toBe(true));
    });

    test('supports combinations', () => {
        const options: RandomPasswordOptions[] = [
            { length: 4, useDigits: true, useSpecialChars: true, useUppercase: true },
            { length: 5, useDigits: false, useSpecialChars: true, useUppercase: true },
            { length: 10, useDigits: true, useSpecialChars: false, useUppercase: true },
            { length: 15, useDigits: true, useSpecialChars: true, useUppercase: false },
            { length: 20, useDigits: true, useSpecialChars: true, useUppercase: true },
        ];

        options.forEach((option) => expect(passwordMatchesOptions(generateRandomPassword(option), option)).toBe(true));
    });

    test('password validation recursion sanity check', () => {
        const options: RandomPasswordOptions[] = Array.from({ length: 1000 }, () => ({
            length: 4,
            useDigits: true,
            useSpecialChars: true,
            useUppercase: true,
        }));

        options.forEach((option) => {
            let counter = 0;
            generateRandomPassword(option, () => counter++);
            expect(counter).toBeLessThan(100);
        });
    });
});
