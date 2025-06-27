import { fullMerge } from '@proton/pass/utils/object/merge';

import { matchRulesV2, validateRulesV2 } from './definition';
import { RULES_V2_MOCK } from './mock';

describe('Rules V2', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: null })).toBe(false);
        });
    });

    describe('Matcher', () => {
        test('returns hostname rules for a clean URL without path', () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://example.com'));
            expect(result).toEqual(RULES_V2_MOCK.rules['example.com']);
        });

        test('returns hostname rules for an unclean URL without path', () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://example.com/#hash?search=test'));
            expect(result).toEqual(RULES_V2_MOCK.rules['example.com']);
        });

        test('returns merged hostname & pathname rules for a clean URL with pathname', () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://example.com/path'));
            expect(result).toEqual(
                fullMerge(RULES_V2_MOCK.rules['example.com'], RULES_V2_MOCK.rules['example.com/path'])
            );
        });

        test('returns merged hostname & pathname rules for an unclean URL with pathname', () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://example.com/path#hash?search=test/'));
            expect(result).toEqual(
                fullMerge(RULES_V2_MOCK.rules['example.com'], RULES_V2_MOCK.rules['example.com/path'])
            );
        });

        test('returns empty object when no rules exist for the URL', () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://example.org'));
            expect(result).toEqual({});
        });

        test('returns empty object if the URL has no pathname and rules exist only for the same URL with pathname', async () => {
            const result = matchRulesV2(RULES_V2_MOCK, new URL('https://proton.me'));
            expect(result).toEqual({});
        });
    });
});
