import { RULES_V1_MOCK } from '@proton/pass/lib/extension/rules/v1/mock';
import { RULES_V2_MOCK } from '@proton/pass/lib/extension/rules/v2/mock';

import { parseRules, validateRules } from './rules';

describe('Validation', () => {
    test('returns `true` if valid object for current supported version', () => {
        expect(validateRules(RULES_V1_MOCK)).toBe(true);
        expect(validateRules(RULES_V2_MOCK)).toBe(true);
    });

    test('returns `false` if version is not supported', () => {
        expect(validateRules({ ...RULES_V1_MOCK, version: '42' })).toBe(false);
        expect(validateRules({ ...RULES_V2_MOCK, version: '42' })).toBe(false);
    });

    test('should return `null` on invalid data', () => {
        expect(validateRules({})).toBe(false);
        expect(validateRules(null)).toBe(false);
        expect(validateRules(undefined)).toBe(false);
    });
});

describe('Parser', () => {
    test('returns `null` if parsing fails', () => {
        expect(parseRules(null)).toEqual(null);
        expect(parseRules('{}')).toEqual(null);
        expect(parseRules('not-json')).toEqual(null);
        expect(parseRules(JSON.stringify({ ...RULES_V1_MOCK, version: '42' }))).toEqual(null);
        expect(parseRules(JSON.stringify({ ...RULES_V2_MOCK, version: '42' }))).toEqual(null);
    });

    test('should support v1', () => {
        expect(parseRules(JSON.stringify(RULES_V1_MOCK))).toEqual(RULES_V1_MOCK);
    });

    test('should support v2', () => {
        expect(parseRules(JSON.stringify(RULES_V2_MOCK))).toEqual(RULES_V2_MOCK);
    });
});
