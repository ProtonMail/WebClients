import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { addDays } from '../../lib/date-fns-utc';
import { canShowB2BOnboardingButton } from '../../lib/onboarding/helpers';

describe('onboarding helpers', () => {
    describe('canShowB2BOnboardingButton', () => {
        const defaultSubscription = buildSubscription();

        it('should be possible to show the b2b onboarding button', () => {
            const subscription = {
                ...defaultSubscription,
                CreateTime: addDays(new Date(), -59).getTime() / 1000,
            } as Subscription;

            expect(canShowB2BOnboardingButton(subscription)).toBe(true);
        });

        it('should not be possible to show the b2b onboarding button', () => {
            const subscription = {
                ...defaultSubscription,
                CreateTime: addDays(new Date(), -61).getTime() / 1000,
            } as Subscription;

            expect(canShowB2BOnboardingButton(subscription)).toBe(false);
            expect(canShowB2BOnboardingButton(undefined)).toBe(false);
        });
    });
});
