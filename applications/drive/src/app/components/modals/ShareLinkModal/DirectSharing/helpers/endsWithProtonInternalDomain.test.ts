import { endsWithProtonInternalDomain } from './endsWithProtonInternalDomain';

describe('endsWithProtonInternalDomain', () => {
    test('should return true for array of emails ending with internal proton domains', () => {
        const emails = [
            'example@proton.ch',
            'example@sub.proton.ch',
            'test@proton.black',
            'test@sub.proton.black',
            'test@proton.pink',
            'admin@sub.proton.pink',
        ];
        expect(emails.every(endsWithProtonInternalDomain)).toBe(true);
    });

    test('should return false for array of emails not ending with internal proton domains', () => {
        const emails = ['example@example.com', 'test@notproton.me', 'test@protonmail.com', 'admin@proton.invalid'];
        expect(emails.every((email) => !endsWithProtonInternalDomain(email))).toBe(true);
    });
});
