import { formatExpirationDateMMYY, formatExpirationDateMMYYYY, formatExpirationDateYYYYMM } from './expiration-date';

describe('expiration date', () => {
    describe('formatExpirationDateMMYY', () => {
        test('should parse and validate MMYY format', () => {
            expect(formatExpirationDateMMYY('012026')).toEqual('0126');
            expect(formatExpirationDateMMYY('0126')).toEqual('0126');
            expect(formatExpirationDateMMYY('122000')).toEqual('1200');
            expect(formatExpirationDateMMYY('1200')).toEqual('1200');
        });

        test('should parse and validate MMYY with separators', () => {
            expect(formatExpirationDateMMYY('12.34')).toEqual('1234');
            expect(formatExpirationDateMMYY('12/34')).toEqual('1234');
            expect(formatExpirationDateMMYY('12-34')).toEqual('1234');
            expect(formatExpirationDateMMYY('12 34')).toEqual('1234');
            expect(formatExpirationDateMMYY('12,34')).toEqual('1234');
        });

        test('should parse and validate MMYYYY with separators', () => {
            expect(formatExpirationDateMMYY('12.2034')).toEqual('1234');
            expect(formatExpirationDateMMYY('12/2034')).toEqual('1234');
            expect(formatExpirationDateMMYY('12-2034')).toEqual('1234');
            expect(formatExpirationDateMMYY('12 2034')).toEqual('1234');
            expect(formatExpirationDateMMYY('12,2034')).toEqual('1234');
            expect(formatExpirationDateMMYY('12,,2034')).toEqual('1234');
        });

        test('should parse and validate YYYY-MM', () => {
            expect(formatExpirationDateMMYY('2034-12')).toEqual('1234');
        });

        test('should return empty string if could not validate date parts', () => {
            expect(formatExpirationDateMMYY('1')).toEqual('');
            expect(formatExpirationDateMMYY('12')).toEqual('');
            expect(formatExpirationDateMMYY('123')).toEqual('');
            expect(formatExpirationDateMMYY('12345')).toEqual('');
            expect(formatExpirationDateMMYY('1234567')).toEqual('');
            expect(formatExpirationDateMMYY('ab26')).toEqual('');
            expect(formatExpirationDateMMYY('notnumber')).toEqual('');
            expect(formatExpirationDateMMYY('12-034')).toEqual('');
        });
    });

    describe('formatExpirationDateMMYYYY', () => {
        test('should parse and validate MMYY format', () => {
            expect(formatExpirationDateMMYYYY('012026')).toEqual('012026');
            expect(formatExpirationDateMMYYYY('0126')).toEqual('012026');
            expect(formatExpirationDateMMYYYY('122000')).toEqual('122000');
            expect(formatExpirationDateMMYYYY('1200')).toEqual('122000');
        });

        test('should parse and validate MMYY with separators', () => {
            expect(formatExpirationDateMMYYYY('12.34')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12/34')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12-34')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12 34')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12,34')).toEqual('122034');
        });

        test('should parse and validate MMYYYY with separators', () => {
            expect(formatExpirationDateMMYYYY('12.2034')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12/2034')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12-2034')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12 2034')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12,2034')).toEqual('122034');
            expect(formatExpirationDateMMYYYY('12,,2034')).toEqual('122034');
        });

        test('should parse and validate YYYY-MM', () => {
            expect(formatExpirationDateMMYYYY('2034-12')).toEqual('122034');
        });

        test('should return empty string if could not validate date parts', () => {
            expect(formatExpirationDateMMYYYY('1')).toEqual('');
            expect(formatExpirationDateMMYYYY('12')).toEqual('');
            expect(formatExpirationDateMMYYYY('123')).toEqual('');
            expect(formatExpirationDateMMYYYY('12345')).toEqual('');
            expect(formatExpirationDateMMYYYY('1234567')).toEqual('');
            expect(formatExpirationDateMMYYYY('ab26')).toEqual('');
            expect(formatExpirationDateMMYYYY('notnumber')).toEqual('');
            expect(formatExpirationDateMMYYYY('12-034')).toEqual('');
        });
    });

    describe('formatExpirationDateYYYYMM', () => {
        test('should parse and validate MMYY format', () => {
            expect(formatExpirationDateYYYYMM('012026')).toEqual('2026-01');
            expect(formatExpirationDateYYYYMM('0126')).toEqual('2026-01');
            expect(formatExpirationDateYYYYMM('122000')).toEqual('2000-12');
            expect(formatExpirationDateYYYYMM('1200')).toEqual('2000-12');
        });

        test('should parse and validate MMYY with separators', () => {
            expect(formatExpirationDateYYYYMM('12.34')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12/34')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12-34')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12 34')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12,34')).toEqual('2034-12');
        });

        test('should parse and validate MMYYYY with separators', () => {
            expect(formatExpirationDateYYYYMM('12.2034')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12/2034')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12-2034')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12 2034')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12,2034')).toEqual('2034-12');
            expect(formatExpirationDateYYYYMM('12,,2034')).toEqual('2034-12');
        });

        test('should parse and validate YYYY-MM', () => {
            expect(formatExpirationDateYYYYMM('2034-12')).toEqual('2034-12');
        });

        test('should return empty string if could not validate date parts', () => {
            expect(formatExpirationDateYYYYMM('1')).toEqual('');
            expect(formatExpirationDateYYYYMM('12')).toEqual('');
            expect(formatExpirationDateYYYYMM('123')).toEqual('');
            expect(formatExpirationDateYYYYMM('12345')).toEqual('');
            expect(formatExpirationDateYYYYMM('1234567')).toEqual('');
            expect(formatExpirationDateYYYYMM('ab26')).toEqual('');
            expect(formatExpirationDateYYYYMM('notnumber')).toEqual('');
            expect(formatExpirationDateYYYYMM('12-034')).toEqual('');
        });
    });
});
