import type { Subscription } from '@proton/payments';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { canShowB2BOnboardingButton } from '@proton/shared/lib/onboarding/helpers';
import { buildSubscription } from '@proton/testing/builders';

describe('onboarding helpers', () => {
    describe('canShowB2BOnboardingButton', () => {
        const defaultSubscription = buildSubscription();

        it('should be possible to show the b2b onboarding button', () => {
            const subscription = {
                ...defaultSubscription,
                CreateTime: addDays(new Date(), -59).getTime() / 1000,
            } as Subscription;

            expect(canShowB2BOnboardingButton(subscription)).toBeTrue();
        });

        it('should not be possible to show the b2b onboarding button', () => {
            const subscription = {
                ...defaultSubscription,
                CreateTime: addDays(new Date(), -61).getTime() / 1000,
            } as Subscription;

            expect(canShowB2BOnboardingButton(subscription)).toBeFalse();
            expect(canShowB2BOnboardingButton()).toBeFalse();
        });
    });
});
