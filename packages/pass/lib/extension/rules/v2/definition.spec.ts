import { validateRulesV2 } from './definition';
import { RULES_V2_MOCK } from './mock';

describe('Rules V2', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: null })).toBe(false);
        });
    });
});
