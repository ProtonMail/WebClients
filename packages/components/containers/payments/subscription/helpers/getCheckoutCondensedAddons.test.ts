import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { FeatureFlagVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import { type CheckoutCondensedAddonsParams, getCheckoutCondensedAddons } from './getCheckoutCondensedAddons';

type Variant = FeatureFlagVariant<'CheckoutCondensedAddons'>;

const variant = (name: string | undefined): Variant => ({ name }) as Variant;

const eligible: CheckoutCondensedAddonsParams = {
    flagsReady: true,
    variant: variant('condensed'),
    selectedPlanIDs: { [PLANS.BUNDLE]: 1 },
    latestSubscription: FREE_SUBSCRIPTION,
    user: { isMember: false, canPay: true },
    isLiteApp: false,
};

describe('getCheckoutCondensedAddons', () => {
    it('should return condensed for an eligible B2C Proton Unlimited checkout in the condensed variant', () => {
        expect(getCheckoutCondensedAddons(eligible)).toBe('condensed');
    });

    it('should return condensed for a Mail Plus user upgrading to Proton Unlimited', () => {
        expect(
            getCheckoutCondensedAddons({
                ...eligible,
                latestSubscription: buildSubscription({ [PLANS.MAIL]: 1 }),
            })
        ).toBe('condensed');
    });

    describe('flag states fall back to control', () => {
        it('should return control when the flag is off (disabled variant)', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, variant: variant('disabled') })).toBe('control');
        });

        it('should return control when the variant name is missing', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, variant: variant(undefined) })).toBe('control');
        });

        it('should return control for the control variant', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, variant: variant('control') })).toBe('control');
        });

        it('should return control for an unknown variant name', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, variant: variant('Condensed') })).toBe('control');
        });

        it('should return control when the flags are not ready', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, flagsReady: false })).toBe('control');
        });
    });

    describe('ineligible checkouts fall back to control', () => {
        it.each([
            ['VPN Plus', PLANS.VPN2024],
            ['Mail Plus', PLANS.MAIL],
            ['Family', PLANS.FAMILY],
            ['Duo', PLANS.DUO],
        ])('should return control for %s', (_, plan) => {
            expect(getCheckoutCondensedAddons({ ...eligible, selectedPlanIDs: { [plan]: 1 } })).toBe('control');
        });

        it('should return control for a B2B plan', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, selectedPlanIDs: { [PLANS.BUNDLE_PRO_2024]: 1 } })).toBe(
                'control'
            );
        });

        it('should return control when the current subscription is B2B', () => {
            expect(
                getCheckoutCondensedAddons({
                    ...eligible,
                    latestSubscription: buildSubscription({ [PLANS.VPN_PRO]: 1 }),
                })
            ).toBe('control');
        });

        it('should return control for organization members', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, user: { isMember: true, canPay: true } })).toBe('control');
        });

        it('should return control for users who cannot pay', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, user: { isMember: false, canPay: false } })).toBe(
                'control'
            );
        });

        it('should return control in the lite app', () => {
            expect(getCheckoutCondensedAddons({ ...eligible, isLiteApp: true })).toBe('control');
        });
    });
});
