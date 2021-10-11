import { getResult } from '../../lib/environment/helper';

describe('Environment based feature values', () => {
    [
        ['alpha', 0b000100, { enabled: true, unavailable: false }],
        ['alpha', 0b100100, { enabled: true, unavailable: true }],
        ['alpha', 0b010100, { enabled: true, unavailable: false }],
        ['beta', 0b000100, { enabled: false, unavailable: false }],
        ['beta', 0b000010, { enabled: true, unavailable: false }],
        ['beta', 0b010010, { enabled: true, unavailable: true }],
        ['beta', 0b010110, { enabled: true, unavailable: true }],
        ['default', 0b000100, { enabled: false, unavailable: false }],
        ['default', 0b000001, { enabled: true, unavailable: false }],
        ['whatever', 0b000100, { enabled: false, unavailable: false }],
        ['whatever', 0b000001, { enabled: true, unavailable: false }],
        ['whatever', 0b001001, { enabled: true, unavailable: true }],
    ].forEach(([env, value, expected]) => {
        it(`getResult(${env}, ${value}) for two keys`, () => {
            expect(getResult(value, env, ['enabled', 'unavailable'])).toEqual(expected);
        });
    });

    [
        ['alpha', undefined, { enabled: false }],
        ['beta', undefined, { enabled: false }],
        ['default', undefined, { enabled: false }],
    ].forEach(([env, value, expected]) => {
        it(`getResult(${env}, ${value}) for one key, undefined value`, () => {
            expect(getResult(value, env, ['enabled'])).toEqual(expected);
        });
    });

    [
        ['alpha', 0b100, { enabled: true }],
        ['beta', 0b100, { enabled: false }],
        ['default', 0b100, { enabled: false }],
        ['beta', 0b101, { enabled: false }],
        ['default', 0b111, { enabled: true }],
        ['whatever', 0b111, { enabled: true }],
    ].forEach(([env, value, expected]) => {
        it(`getResult(${env}, ${value}) for one key, bitmap value`, () => {
            expect(getResult(value, env, ['enabled'])).toEqual(expected);
        });
    });

    [
        ['alpha', false, { enabled: false }],
        ['alpha', true, { enabled: false }],
        ['beta', false, { enabled: false }],
        ['beta', true, { enabled: false }],
        ['default', false, { enabled: false }],
        ['default', true, { enabled: true }],
    ].forEach(([env, value, expected]) => {
        it(`getResult(${env}, ${value}) for one key, Boolean value`, () => {
            expect(getResult(value, env, ['enabled'])).toEqual(expected);
        });
    });

    describe('enabled & unavailable in alpha, disabled & unavailable in beta, enabled in default', () => {
        [
            ['alpha', { enabled: true, unavailable: true }],
            ['beta', { enabled: false, unavailable: true }],
            ['default', { enabled: true, unavailable: false }],
        ].forEach(([env, expected]) => {
            const value = 0b110101;
            it(`getResult(${env}, ${value})`, () => {
                expect(getResult(value, env, ['enabled', 'unavailable'])).toEqual(expected);
            });
        });
    });

    describe('enabled in alpha, enabled & unavailable in beta, disabled in default', () => {
        [
            ['alpha', { enabled: true, unavailable: false }],
            ['beta', { enabled: true, unavailable: true }],
            ['default', { enabled: false, unavailable: false }],
        ].forEach(([env, expected]) => {
            const value = 0b010110;
            it(`getResult(${env}, ${value})`, () => {
                expect(getResult(value, env, ['enabled', 'unavailable'])).toEqual(expected);
            });
        });
    });
});
