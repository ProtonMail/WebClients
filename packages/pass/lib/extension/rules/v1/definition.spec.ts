import { matchRulesV1, validateRulesV1 } from './definition';
import { RULES_V1_MOCK } from './mock';

describe('Rules V1', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: { 'example.com': 'rule' } })).toBe(false);
        });
    });

    describe('Matcher', () => {
        test('returns hostname rules for a clean URL without path', () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://example.com'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2']);
        });

        test('returns hostname rules for an unclean URL without path', () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://example.com/#hash?search=test'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2']);
        });

        test('returns hostname & pathname rules for a clean URL with pathname', () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://example.com/path'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2', 'rule > path > 1']);
        });

        test('returns hostname & pathname rules for an unclean URL with pathname', () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://example.com/path#hash?search=test/'));
            expect(result).toEqual(['rule > host > 1', 'rule > host > 2', 'rule > path > 1']);
        });

        test('returns empty array when no rules exist for the URL', () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://example.org'));
            expect(result).toEqual([]);
        });

        test('returns empty array if the URL has no pathname and rules exist only for the same URL with pathname', async () => {
            const result = matchRulesV1(RULES_V1_MOCK, new URL('https://proton.me'));
            expect(result).toEqual([]);
        });
    });
});
