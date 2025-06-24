import { validateRulesV1 } from './definition';
import { RULES_V1_MOCK } from './mock';

describe('Rules V1', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: { 'example.com': 'rule' } })).toBe(false);
        });
    });
});
