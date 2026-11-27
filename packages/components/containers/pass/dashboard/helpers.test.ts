import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

import { isAutoAssignedPassProfessionalTrial } from './helpers';

describe('isAutoAssignedPassProfessionalTrial', () => {
    const autoAssignedTrial: Subscription = {
        ...buildSubscription(PLANS.PASS_BUSINESS),
        IsTrial: true,
        Renew: Renew.Disabled,
    };

    it('is true for a Pass Professional trial that does not renew and has no payment method', () => {
        expect(isAutoAssignedPassProfessionalTrial(autoAssignedTrial, false)).toBe(true);
    });

    it('is false when a payment method is on file', () => {
        expect(isAutoAssignedPassProfessionalTrial(autoAssignedTrial, true)).toBe(false);
    });

    it('is false when the trial renews', () => {
        expect(isAutoAssignedPassProfessionalTrial({ ...autoAssignedTrial, Renew: Renew.Enabled }, false)).toBe(false);
    });

    it('is false for a paid Pass Professional subscription', () => {
        expect(isAutoAssignedPassProfessionalTrial({ ...autoAssignedTrial, IsTrial: false }, false)).toBe(false);
    });

    it('is false for a trial of another plan', () => {
        expect(
            isAutoAssignedPassProfessionalTrial(
                { ...buildSubscription(PLANS.MAIL_PRO), IsTrial: true, Renew: Renew.Disabled },
                false
            )
        ).toBe(false);
    });

    it('is false without a subscription', () => {
        expect(isAutoAssignedPassProfessionalTrial(undefined, false)).toBe(false);
    });
});
