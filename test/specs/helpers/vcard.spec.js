import { cleanValue, orderByPref, escapeValue, unescapeValue } from '../../../src/helpers/vcard';
import { BOOL_FIELDS } from '../../../src/helpers/vCardFields';

const ADDRESS = ';;Chemin\\; du Pré-Fleuri 3;Plan\\,les:Ouates;;1228;CH';
const NAME = 'Yen; Andy;;;';
const PROPERTY1 = new vCard.Property('email', 'riri@pm.me', { pref: 2 });
const PROPERTY2 = new vCard.Property('email', 'fifi@pm.me', { pref: '10' });
const PROPERTY3 = new vCard.Property('email', 'loulou@pm.me');
const PROPERTIES = [PROPERTY1, PROPERTY3, PROPERTY2];
const PROPERTIES_ORDERED = [PROPERTY1, PROPERTY2, PROPERTY3];

describe('Helper vcard', () => {

    describe('cleanValue', () => {
        it('shoud parse address', () => {
            expect(cleanValue(ADDRESS, 'adr'))
                .toEqual(['', '', 'Chemin; du Pré-Fleuri 3', 'Plan,les:Ouates', '', '1228', 'CH']);
        });

        it('shoud parse name', () => {
            expect(cleanValue(NAME, 'n'))
                .toEqual(['Yen', ' Andy', '', '', '']);
        });

        it('shoud parse boolean', () => {
            expect(cleanValue('False   ', BOOL_FIELDS[0]))
                .toEqual(false);
        });

        it('should parse string', () => {
            expect(cleanValue('A\\;n:dy\\, Yen', 'fn'))
                .toEqual('A;n:dy, Yen');
        });
    });

    describe('unescapeValue', () => {
        [
            {
                name: 'not unescape base 64 if not extended',
                input: ['data\\:application/pgp-keys;base64,xsFNBFuqPgwBEADFuCqkEPs7lxUDTwMj4Sso1olsA3wYhLzLzMHhp1f1NnRhwlDZdO3esc9S4OQuZMc7q4IvXZdvsLS5qTP41p1a/f+LSri/WF60+cvYyU9t/hlKltA9miOQvB3XCr969RY3tediTAH2XSwk/UfiPaAfyLx4//x30+Ra0+4L/JGPpQQLoR+X/+/AlT0EMtnXrldHm7ArKaggHsNSdSmdzr1URFg'],
                output: 'data\\:application/pgp-keys;base64,xsFNBFuqPgwBEADFuCqkEPs7lxUDTwMj4Sso1olsA3wYhLzLzMHhp1f1NnRhwlDZdO3esc9S4OQuZMc7q4IvXZdvsLS5qTP41p1a/f+LSri/WF60+cvYyU9t/hlKltA9miOQvB3XCr969RY3tediTAH2XSwk/UfiPaAfyLx4//x30+Ra0+4L/JGPpQQLoR+X/+/AlT0EMtnXrldHm7ArKaggHsNSdSmdzr1URFg'
            },
            {
                name: 'unescape base 64 if extended',
                input: ['data\\:application/pgp-keys;base64,xsFNBFuqPgwBEADFuCqkEPs7lxUDTwMj4Sso1olsA3wYhLzLzMHhp1f1NnRhwlDZdO3esc9S4OQuZMc7q4IvXZdvsLS5qTP41p1a/f+LSri/WF60+cvYyU9t/hlKltA9miOQvB3XCr969RY3tediTAH2XSwk/UfiPaAfyLx4//x30+Ra0+4L/JGPpQQLoR+X/+/AlT0EMtnXrldHm7ArKaggHsNSdSmdzr1URFg', true],
                output: 'data:application/pgp-keys;base64,xsFNBFuqPgwBEADFuCqkEPs7lxUDTwMj4Sso1olsA3wYhLzLzMHhp1f1NnRhwlDZdO3esc9S4OQuZMc7q4IvXZdvsLS5qTP41p1a/f+LSri/WF60+cvYyU9t/hlKltA9miOQvB3XCr969RY3tediTAH2XSwk/UfiPaAfyLx4//x30+Ra0+4L/JGPpQQLoR+X/+/AlT0EMtnXrldHm7ArKaggHsNSdSmdzr1URFg'
            }
        ].forEach(({ name, input, output }) => {
            it(`should ${name}`, () => {
                expect(unescapeValue.apply(undefined, input))
                    .toEqual(output);
            });
        });


        describe('Extended has to be a boolean', () => {
            [
                {
                    name: 'not use the extended rule',
                    input: ['monique\\,dew\\:\\,robert','monique\\,dew\\:\\,robert', 'monique\\,dew\\:\\,robert'],
                    output: ['monique,dew\\:,robert', 'monique,dew\\:,robert', 'monique,dew\\:,robert']
                }
            ].forEach(({ name, input, output }) => {
                it(`should ${name}`, () => {
                    expect(input.map(unescapeValue))
                        .toEqual(output);
                });
            });
        });
    });
    describe('escapeValue', () => {
        [
            {
                name: 'should escape COMMA character with a BACKSLASH',
                input: 'pandi,panda',
                output: 'pandi\\,panda'
            },
            {
                name: 'should escape BACKSLASH character with a BACKSLASH',
                input: 'pandi\\panda',
                output: 'pandi\\\\panda'
            },
            {
                name: 'should escape SEMICOLON character with a BACKSLASH',
                input: 'pandi;panda',
                output: 'pandi\\;panda'
            },
            {
                name: 'should handle integer',
                input: 3.14,
                output: '3.14'
            },
            {
                name: 'should handle array as value',
                input: [
                    'pandi,panda',
                    'pandi\\panda',
                    'pandi;panda'
                ],
                output: [
                    'pandi\\,panda',
                    'pandi\\\\panda',
                    'pandi\\;panda'
                ]
            }
        ].forEach(({ name, input, output }) => {
            it(name, () => {
                expect(escapeValue(input))
                    .toEqual(output);
            });
        });
    });

    describe('orderByPref', () => {
        it('should order properties properly', () => {
            expect(orderByPref(PROPERTIES))
                .toEqual(PROPERTIES_ORDERED);
        });
    });

});
