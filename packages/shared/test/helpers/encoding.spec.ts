import {encodeBase64URL, decodeBase64URL, validateBase64string} from '../../lib/helpers/encoding';

describe('encoding', () => {
    describe('encodeBase64URL', () => {
        const validChars = '_-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const strings = ['', 'The quick brown fox jumps over the lazy dog', '@#N{}|*sdgOnf&çÇéöªº', 'foobar'];

        it('should only use valid characters', () => {
            const filterEncode = (str: string) =>
                encodeBase64URL(str)
                    .split('')
                    .filter((char) => validChars.includes(char))
                    .join('');
            expect(strings.map((string) => encodeBase64URL(string))).toEqual(strings.map(filterEncode));
        });

        it('should roundtrip strings', () => {
            strings.forEach((string) => {
                expect(decodeBase64URL(encodeBase64URL(string))).toEqual(string);
            });
        });

        it('should keep padding when told to', () => {
            const string = 'dogs';

            expect(encodeBase64URL(string)).toEqual('ZG9ncw');
            expect(encodeBase64URL(string, false)).toEqual('ZG9ncw==');
        });
    });

    describe('validateBase64', () => {
        it('should accept valid base64 strings', () => {
            const strings = [
                'u6eqY7+WQ29/NFIM',
                'xpppt/D1BgxgJR=',
                '+++==',
                'kZyjUaHmEp+aZG65nBuyxno===',
                'A',
                ''
            ];

            expect(strings.map((string) => validateBase64string(string))).toEqual(strings.map(() => true))
        });

        it('should refuse invalid base64 strings', () => {
            const strings = [
                'u6_qY7+WQ29/NFIM',
                'xp-pt/D1BgxgJR=',
                'kZyjUaHmEp+aZG65nBuyxno====',
                'français'
            ];

            expect(strings.map((string) => validateBase64string(string))).toEqual(strings.map(() => false))
        });

        it('should accept valid base64 strings with the variant alphabet', () => {
            const strings = [
                'LOtmC6pJ20mWneQs-8kE6',
                'Wls6U2lgOn_3e4L9TUTedbmy26O4vZ6Yiw6iL_bI0qE1bHZtg=',
                '-DiyDdiBg5fAAiamijSA47AG9jZ-eIp4lFZ4inQQeKvdUGBJB66h1q65CHa_qicib0OkaC8W8ZUOq8icLzKiKw==',
                'A',
                ''
            ];

            expect(strings.map((string) => validateBase64string(string, true))).toEqual(strings.map(() => true))
        });

        it('should refuse invalid base64 strings with variant alphabet', () => {
            const strings = [
                'u6eqY7+WQ29/NFIM',
                'xpppt/D1BgxgJR=',
                '+++==',
                'kZyjUaHmEp_aZG65nBuyxno====',
                'français'
            ];

            expect(strings.map((string) => validateBase64string(string, true))).toEqual(strings.map(() => false))
        })
    })
});
