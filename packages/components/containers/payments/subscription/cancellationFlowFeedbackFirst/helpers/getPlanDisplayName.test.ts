import { PLANS } from '@proton/payments/core/constants';

import { getPlanDisplayName } from './getPlanDisplayName';

describe('getPlanDisplayName', () => {
    it('prepends the brand name to the Visionary plan name', () => {
        expect(getPlanDisplayName(PLANS.VISIONARY)).toBe('Proton Visionary');
    });

    it('prepends the brand name to Visionary even when a fallback title is provided', () => {
        expect(getPlanDisplayName(PLANS.VISIONARY, 'Some other title')).toBe('Proton Visionary');
    });

    it('returns the fallback title for Bundle Pro when provided', () => {
        expect(getPlanDisplayName(PLANS.BUNDLE_PRO, 'Proton Business')).toBe('Proton Business');
    });

    it('falls back to the plan name for Bundle Pro when no title is provided', () => {
        expect(getPlanDisplayName(PLANS.BUNDLE_PRO)).toBe('Proton Business Suite');
    });

    it('returns the plan name for a standard plan', () => {
        expect(getPlanDisplayName(PLANS.MAIL)).toBe('Mail Plus');
    });

    it('ignores the fallback title when the plan name is known', () => {
        expect(getPlanDisplayName(PLANS.MAIL, 'Ignored title')).toBe('Mail Plus');
    });

    it('does not prepend the brand name to plans that already include it', () => {
        expect(getPlanDisplayName(PLANS.BUNDLE)).toBe('Proton Unlimited');
    });
});
