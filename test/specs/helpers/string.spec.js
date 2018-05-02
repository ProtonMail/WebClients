import { removeEmailAlias, toUnsignedString } from '../../../src/helpers/string';

const EMAILS = {
    'dew@foo.bar': 'dew@foo.bar',
    'dew.new@foo.bar': 'dewnew@foo.bar',
    'dew+polo@foo.bar': 'dew@foo.bar',
    'dew.new+polo@foo.bar': 'dewnew@foo.bar',
    'dew.NEW+polo@foo.bar': 'dewnew@foo.bar'
};

const TEST_HEX = {
    65536: '10000',
    128892: '1f77c',
    '-128892': 'fffe0884',
    268435455: 'fffffff',
    1268435455: '4b9ac9ff',
    '-1268435455': 'b4653601',
    '-2147000000': '80076140'
};

const TEST_BINARY = {
    65536: '10000000000000000',
    128892: '11111011101111100',
    '-128892': '11111111111111100000100010000100',
    268435455: '1111111111111111111111111111',
    1268435455: '1001011100110101100100111111111',
    '-1268435455': '10110100011001010011011000000001',
    '-2147000000': '10000000000001110110000101000000'
};

describe('removeEmailAlias', () => {

    it('should remove the alias but keep the email', () => {
        Object.keys(EMAILS).forEach((email) => {
            expect(removeEmailAlias(email)).toBe(EMAILS[email]);
        });
    });
});

describe('toUnsignedString', () => {

    it('should correctly encode to binary', () => {
        Object.keys(TEST_BINARY).forEach((str) => {
            expect(toUnsignedString(Number.parseInt(str, 10), 1)).toBe(TEST_BINARY[str]);
        });
    });

    it('should correctly encode to hex', () => {
        Object.keys(TEST_HEX).forEach((str) => {
            expect(toUnsignedString(Number.parseInt(str, 10), 4)).toBe(TEST_HEX[str]);
        });
    });

});
