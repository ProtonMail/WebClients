import { ADDON_NAMES, PLANS } from './constants';
import { isValidPlanName } from './type-guards';

describe('type-guard', () => {
    it('validates plan name', () => {
        expect(isValidPlanName(PLANS.BUNDLE)).toBe(true);
        expect(isValidPlanName(PLANS.MAIL)).toBe(true);
        expect(isValidPlanName(ADDON_NAMES.DOMAIN_BUNDLE_PRO)).toBe(false);
        expect(isValidPlanName(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO)).toBe(false);
        expect(isValidPlanName(undefined as any)).toBe(false);
        expect(isValidPlanName('')).toBe(false);
    });
});
