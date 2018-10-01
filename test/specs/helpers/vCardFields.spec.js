import { getKeys, isPersonalsKey, FIELDS } from '../../../src/helpers/vCardFields';

describe('Helper vCardFields', () => {

    describe('Get a key from a vCard', () => {

        [
            {
                name: 'not extract anything if the format is not uppercase',
                input: ['fn', {}, false]
            },
            {
                name: 'not extract anything if the field is undefined',
                input: [undefined, {}, false]
            },
            {
                name: 'not extract anything if the field does not exist',
                input: ['jean michel sur seine', {}, false]
            },
            {
                name: 'extract a key from FIELDS',
                input: ['FN', {}, false],
                output: FIELDS.FN
            },
            {
                name: 'extract a key from FIELDS 2',
                input: ['PERSONALS', {}, false],
                output: FIELDS.PERSONALS
            },
            {
                name: 'extract a key from PERSONALS',
                input: ['ANNIVERSARY', {}, true],
                output: ['anniversary']
            },
            {
                name: 'extract a wrong key from PERSONALS',
                input: ['JEANNE', {}, true]
            },
            {
                name: 'extract a wrong key undefined from PERSONALS',
                input: [undefined, {}, true]
            },
            {
                name: 'extract a nothing from key from PERSONALS if no flag',
                input: ['ANNIVERSARY', {}, false]
            },
            {
                name: 'extract nothing from a vCard if it is empty',
                input: ['CUSTOMS', { data: {} }, false],
                output: []
            },
            {
                name: 'extract informations from a vCard without non standard keys',
                input: ['CUSTOMS', {
                    data: {
                        FN: 42,
                        PHOTO: 1337,
                        'X-PM-SIGN': true
                    }
                }, false],
                output: ['FN', 'PHOTO', 'X-PM-SIGN']
            },
            {
                name: 'extract informations from a vCard with non standard keys',
                input: ['CUSTOMS', {
                    data: {
                        fn: 42,
                        'X-PM-SIGN': true
                    }
                }, false],
                output: ['X-PM-SIGN']
            }
        ].forEach(({ name, input, output }) => {
            it(`should ${name}`, () => {
                expect(getKeys.apply(null, input)).toEqual(output);
            });
        });
    });

    describe('Check if a field is personnal', () => {

        [
            {
                name: 'mark them as invalid',
                input: FIELDS.AVOID.concat(FIELDS.FN, FIELDS.EMAILS),
                output: false
            },
            {
                name: 'mark them as valid',
                input: FIELDS.PERSONALS,
                output: true
            }
        ].forEach(({ name, input, output }) => {
            it(`should ${name}`, () => {
                expect(input.every(isPersonalsKey)).toEqual(output);
            });
        });
    });
});
