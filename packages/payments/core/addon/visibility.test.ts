import { APPS } from '@proton/shared/lib/constants';

import { buildSubscription } from '../../testing/buildSubscription';
import { ADDON_NAMES, ADDON_PREFIXES, FREE_SUBSCRIPTION, PLANS } from '../constants';
import { SubscriptionPlatform } from '../subscription/constants';
import type { AddonCustomizerContext } from './interfaces';
import {
    domainVpnBusinessGate,
    notExternallyManagedLumo,
    notInMailOrCalendarContext,
    passesCouponGate,
    planSupportsAddon,
} from './visibility';

const ctx = (overrides: Partial<AddonCustomizerContext> = {}): AddonCustomizerContext => ({
    subscription: FREE_SUBSCRIPTION,
    planIDs: {},
    bannerHiddenByCoupon: false,
    featureFlagEnabled: false,
    isSignup: false,
    ...overrides,
});

describe('planSupportsAddon', () => {
    it('returns true when the selected plan sells the addon', () => {
        expect(planSupportsAddon(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.MAIL]: 1 } }))).toBe(true);
        expect(planSupportsAddon(ADDON_PREFIXES.MEET)(ctx({ planIDs: { [PLANS.BUNDLE]: 1 } }))).toBe(true);
    });

    it('returns false when the selected plan does not sell the addon', () => {
        expect(planSupportsAddon(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.LUMO]: 1 } }))).toBe(false);
        expect(planSupportsAddon(ADDON_PREFIXES.MEET)(ctx({ planIDs: { [PLANS.MEET]: 1 } }))).toBe(false);
    });

    it('returns false when no plan is selected', () => {
        expect(planSupportsAddon(ADDON_PREFIXES.LUMO)(ctx({ planIDs: {} }))).toBe(false);
    });
});

describe('passesCouponGate', () => {
    it('passes when the banner is not hidden by coupon', () => {
        expect(
            passesCouponGate(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.MAIL]: 1 }, bannerHiddenByCoupon: false }))
        ).toBe(true);
    });

    it('fails when hidden by coupon and the addon is not selected', () => {
        expect(
            passesCouponGate(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.MAIL]: 1 }, bannerHiddenByCoupon: true }))
        ).toBe(false);
    });

    it('passes when hidden by coupon but the addon is already selected', () => {
        expect(
            passesCouponGate(ADDON_PREFIXES.LUMO)(
                ctx({ planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 }, bannerHiddenByCoupon: true })
            )
        ).toBe(true);
        expect(
            passesCouponGate(ADDON_PREFIXES.MEET)(
                ctx({ planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 }, bannerHiddenByCoupon: true })
            )
        ).toBe(true);
    });
});

describe('notInMailOrCalendarContext', () => {
    it.each([APPS.PROTONMAIL, APPS.PROTONCALENDAR])('fails in %s when the addon is not selected', (app) => {
        expect(notInMailOrCalendarContext(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.MAIL]: 1 }, app }))).toBe(false);
        expect(notInMailOrCalendarContext(ADDON_PREFIXES.MEET)(ctx({ planIDs: { [PLANS.MAIL]: 1 }, app }))).toBe(false);
    });

    it('passes in Mail when the addon is already selected', () => {
        expect(
            notInMailOrCalendarContext(ADDON_PREFIXES.LUMO)(
                ctx({ planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 }, app: APPS.PROTONMAIL })
            )
        ).toBe(true);
        expect(
            notInMailOrCalendarContext(ADDON_PREFIXES.MEET)(
                ctx({ planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 }, app: APPS.PROTONMAIL })
            )
        ).toBe(true);
    });

    it.each([PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO_2024])(
        'passes in Mail and Calendar when the selected plan is the business plan %s',
        (plan) => {
            for (const app of [APPS.PROTONMAIL, APPS.PROTONCALENDAR]) {
                expect(notInMailOrCalendarContext(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [plan]: 1 }, app }))).toBe(
                    true
                );
                expect(notInMailOrCalendarContext(ADDON_PREFIXES.MEET)(ctx({ planIDs: { [plan]: 1 }, app }))).toBe(
                    true
                );
            }
        }
    );

    it.each([APPS.PROTONDRIVE, APPS.PROTONACCOUNT, undefined])('passes in %s', (app) => {
        expect(notInMailOrCalendarContext(ADDON_PREFIXES.LUMO)(ctx({ planIDs: { [PLANS.MAIL]: 1 }, app }))).toBe(true);
    });
});

describe('notExternallyManagedLumo', () => {
    it('returns false for an externally managed lumo subscription', () => {
        const subscription = buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android });
        expect(notExternallyManagedLumo(ctx({ subscription }))).toBe(false);
    });

    it('returns false when a secondary subscription is an externally managed lumo subscription', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, {
            SecondarySubscriptions: [buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android })],
        });
        expect(notExternallyManagedLumo(ctx({ subscription }))).toBe(false);
    });

    it('returns true for a non-externally-managed subscription', () => {
        const subscription = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.Default });
        expect(notExternallyManagedLumo(ctx({ subscription }))).toBe(true);
    });
});

describe('domainVpnBusinessGate', () => {
    it('always shows for non-VPN_BUSINESS plans', () => {
        expect(domainVpnBusinessGate(ctx({ planIDs: { [PLANS.BUNDLE_PRO_2024]: 1 }, featureFlagEnabled: false }))).toBe(
            true
        );
    });

    it('hides for VPN_BUSINESS during signup even with the flag on', () => {
        expect(
            domainVpnBusinessGate(
                ctx({ planIDs: { [PLANS.VPN_BUSINESS]: 1 }, featureFlagEnabled: true, isSignup: true })
            )
        ).toBe(false);
    });

    it('shows for VPN_BUSINESS when the flag is on', () => {
        expect(domainVpnBusinessGate(ctx({ planIDs: { [PLANS.VPN_BUSINESS]: 1 }, featureFlagEnabled: true }))).toBe(
            true
        );
    });

    it('shows for VPN_BUSINESS (flag off) when the subscription already has a domain addon', () => {
        const subscription = buildSubscription({ [PLANS.VPN_BUSINESS]: 1, [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 1 });
        expect(
            domainVpnBusinessGate(
                ctx({ planIDs: { [PLANS.VPN_BUSINESS]: 1 }, subscription, featureFlagEnabled: false })
            )
        ).toBe(true);
    });

    it('hides for VPN_BUSINESS when the flag is off and no domain addon is owned', () => {
        expect(domainVpnBusinessGate(ctx({ planIDs: { [PLANS.VPN_BUSINESS]: 1 }, featureFlagEnabled: false }))).toBe(
            false
        );
    });
});
