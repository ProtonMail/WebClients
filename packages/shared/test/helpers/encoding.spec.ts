import { encodeBase64URL, decodeBase64URL } from '../../lib/helpers/encoding';

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
});
