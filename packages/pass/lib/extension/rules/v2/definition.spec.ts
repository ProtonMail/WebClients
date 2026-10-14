import { RULES_V2_MOCK } from '../../../../utils/tests/fixtures/website-rules.v2';
import { validateRulesV2 } from './definition';

describe('Rules V2', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV2({ ...RULES_V2_MOCK, rules: null })).toBe(false);
        });
    });
});
