import { RULES_V1_MOCK } from '../../../../utils/tests/fixtures/website-rules.v1';
import { validateRulesV1 } from './definition';

describe('Rules V1', () => {
    describe('Validation', () => {
        test('returns `false` on invalid data', () => {
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: [] })).toBe(false);
            expect(validateRulesV1({ ...RULES_V1_MOCK, rules: { 'example.com': 'rule' } })).toBe(false);
        });
    });
});
