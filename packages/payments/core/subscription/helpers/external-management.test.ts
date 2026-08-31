import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { FREE_SUBSCRIPTION, PLANS } from '../../constants';
import { SubscriptionPlatform } from '../constants';
import { hasLumoMobileSubscription, hasNoExternallyManagedLumoSubscription } from './external-management';

describe('hasNoExternallyManagedLumoSubscription', () => {
    it('returns false for an externally managed primary or secondary Lumo subscription', () => {
        expect(
            hasNoExternallyManagedLumoSubscription(
                buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android })
            )
        ).toBe(false);
        expect(
            hasNoExternallyManagedLumoSubscription(
                buildSubscription(PLANS.MAIL, {
                    SecondarySubscriptions: [buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS })],
                })
            )
        ).toBe(false);
    });

    it('returns true for free and web-managed subscriptions', () => {
        expect(hasNoExternallyManagedLumoSubscription(FREE_SUBSCRIPTION)).toBe(true);
        expect(
            hasNoExternallyManagedLumoSubscription(
                buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Default })
            )
        ).toBe(true);
    });
});

describe('hasLumoMobileSubscription', () => {
    it('should return false for free subscription', () => {
        expect(hasLumoMobileSubscription(FREE_SUBSCRIPTION)).toBe(false);
    });

    it('should return false if subscription is undefined or null', () => {
        expect(hasLumoMobileSubscription(undefined)).toBe(false);
        expect(hasLumoMobileSubscription(null as any)).toBe(false);
    });

    it('should return false if subscription is not externally managed', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Default,
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(false);
    });

    it('should return true if subscription is externally managed and has Lumo', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(true);
    });

    it('should return false if user does not have secondary subscriptions', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, {});
        expect(hasLumoMobileSubscription(subscription)).toBe(false);
    });

    it('should return true if user has secondary subscriptions and at least one of them is externally managed and has Lumo', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, {
            SecondarySubscriptions: [
                buildSubscription(PLANS.VPN2024, { External: SubscriptionPlatform.Default }),
                buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android }),
            ],
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(true);
    });
});
