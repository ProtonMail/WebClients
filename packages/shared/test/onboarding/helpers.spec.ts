import { CYCLE, External, Renew, type Subscription } from '@proton/payments';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { canShowB2BOnboardingButton } from '@proton/shared/lib/onboarding/helpers';

describe('onboarding helpers', () => {
    describe('canShowB2BOnboardingButton', () => {
        const defaultSubscription = {
            ID: 'id-123',
            InvoiceID: 'invoice-id-123',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: 123,
            PeriodEnd: 777,
            CreateTime: 123,
            CouponCode: null,
            Currency: 'EUR',
            Amount: 123,
            RenewAmount: 123,
            Discount: 123,
            RenewDiscount: 123,
            Plans: [],
            External: External.Default,
            Renew: Renew.Enabled,
        } as Subscription;

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
