import { describe, expect, it } from 'vitest';

import { PLANS } from '@proton/payments/core/constants';

import { REGULAR_B2C_ONBOARDING_STEPS, isRegularB2COnboarding } from './isRegularB2COnboarding';

type Params = Parameters<typeof isRegularB2COnboarding>[0];

const check = (overrides: Partial<Params> = {}) =>
    isRegularB2COnboarding({
        stepsToDisplay: new Set(REGULAR_B2C_ONBOARDING_STEPS),
        isReplay: false,
        hasGenericWelcomeStep: true,
        organization: { PlanName: PLANS.FREE, MaxMembers: 1 },
        ...overrides,
    });

describe('isRegularB2COnboarding', () => {
    it('is true for a first-time user with exactly the four regular cards', () => {
        expect(check()).toBe(true);
    });

    it('is true while the organization is not loaded', () => {
        expect(check({ organization: undefined })).toBe(true);
    });

    it('is false for a replay', () => {
        expect(check({ isReplay: true })).toBe(false);
    });

    it('is false when the generic welcome step is not shown, so the themes card is not either', () => {
        expect(check({ hasGenericWelcomeStep: false })).toBe(false);
    });

    it('is false for a B2B plan', () => {
        expect(check({ organization: { PlanName: PLANS.MAIL_PRO, MaxMembers: 1 } })).toBe(false);
    });

    it('is false for a multi-user organization', () => {
        expect(check({ organization: { PlanName: PLANS.FAMILY, MaxMembers: 6 } })).toBe(false);
    });

    it.each(REGULAR_B2C_ONBOARDING_STEPS)('is false when the %s card is missing', (missing) => {
        const stepsToDisplay = new Set(REGULAR_B2C_ONBOARDING_STEPS);
        stepsToDisplay.delete(missing);

        expect(check({ stepsToDisplay })).toBe(false);
    });

    it.each([
        'display-name',
        'partner',
        'activate-premium-features',
        'new-onboarding-organization',
        'choose-view-layout',
    ])('is false when the %s card is added', (extra) => {
        expect(check({ stepsToDisplay: new Set(REGULAR_B2C_ONBOARDING_STEPS).add(extra) })).toBe(false);
    });
});
