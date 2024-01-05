import { expirationDateMMYY, expirationDateMMYYYY } from '@proton/pass/lib/validation/credit-card';

describe('expiration date', () => {
    describe('expirationDateMMYY', () => {
        test('should return expiration date in format MMYY', () => {
            expect(expirationDateMMYY('012026')).toEqual('0126');
            expect(expirationDateMMYY('0126')).toEqual('0126');
            expect(expirationDateMMYY('122000')).toEqual('1200');
            expect(expirationDateMMYY('1200')).toEqual('1200');
        });

        test('should return empty string on falsy values', () => {
            expect(expirationDateMMYY('')).toEqual('');
            expect(expirationDateMMYY(undefined as any)).toEqual('');
            expect(expirationDateMMYY(null as any)).toEqual('');
        });

        test('should throw if length different from 4 or 6', () => {
            expect(() => expirationDateMMYYYY('1')).toThrow();
            expect(() => expirationDateMMYYYY('12')).toThrow();
            expect(() => expirationDateMMYYYY('123')).toThrow();
            expect(() => expirationDateMMYYYY('12345')).toThrow();
            expect(() => expirationDateMMYYYY('1234567')).toThrow();
        });

        test('should throw on invalid strings', () => {
            expect(() => expirationDateMMYY('ab26')).toThrow();
            expect(() => expirationDateMMYY('notnumber')).toThrow();
        });
    });

    describe('expirationDateMMYYYY', () => {
        test('should return expiration date in format MMYYYY', () => {
            expect(expirationDateMMYYYY('0126')).toEqual('012026');
            expect(expirationDateMMYYYY('012026')).toEqual('012026');
            expect(expirationDateMMYYYY('1200')).toEqual('122000');
            expect(expirationDateMMYYYY('122000')).toEqual('122000');
        });

        test('should return empty string on falsy values', () => {
            expect(expirationDateMMYYYY('')).toEqual('');
            expect(expirationDateMMYYYY(undefined as any)).toEqual('');
            expect(expirationDateMMYYYY(null as any)).toEqual('');
        });

        test('should throw if length different from 4 or 6', () => {
            expect(() => expirationDateMMYYYY('1')).toThrow();
            expect(() => expirationDateMMYYYY('12')).toThrow();
            expect(() => expirationDateMMYYYY('123')).toThrow();
            expect(() => expirationDateMMYYYY('12345')).toThrow();
            expect(() => expirationDateMMYYYY('1234567')).toThrow();
        });

        test('should throw on invalid strings', () => {
            expect(() => expirationDateMMYYYY('ab26')).toThrow();
            expect(() => expirationDateMMYYYY('notnumber')).toThrow();
        });
    });
});
