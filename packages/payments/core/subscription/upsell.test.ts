import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { buildSubscription } from '../../testing/buildSubscription';
import { COUPON_CODES, CYCLE, PLANS } from '../constants';
import { getUpgradePath } from './upsell';

// Regression suite mirroring the getUpgradePath coverage in
// packages/shared/tests/upsell/upsell.spec.ts (the legacy implementation),
// plus additional cases, to attest feature parity between both versions.
describe('getUpgradePath', () => {
    const freeUser = { isFree: true } as UserModel;
    const paidUser = { isFree: false } as UserModel;

    it('returns /upgrade without query params for a free user with no options', () => {
        expect(getUpgradePath({ user: freeUser, app: APPS.PROTONMAIL })).toBe('/upgrade');
    });

    it('treats a missing user like a free user', () => {
        expect(getUpgradePath({ app: APPS.PROTONMAIL })).toBe('/upgrade');
    });

    it('returns /dashboard for a free user in vpn settings', () => {
        expect(getUpgradePath({ user: freeUser, app: APPS.PROTONVPN_SETTINGS })).toBe('/dashboard');
    });

    it('includes subscription search params and audience for a free user', () => {
        const path = getUpgradePath({
            user: freeUser,
            app: APPS.PROTONMAIL,
            plan: PLANS.MAIL,
            coupon: COUPON_CODES.BLACK_FRIDAY_2025,
            cycle: CYCLE.YEARLY,
            audience: Audience.B2B,
            fixedPlan: true,
        });
        const params = new URLSearchParams(path.split('?')[1]);

        expect(path.startsWith('/upgrade?')).toBe(true);
        expect(params.get('plan')).toBe('mail2022');
        expect(params.get('coupon')).toBe(COUPON_CODES.BLACK_FRIDAY_2025);
        expect(params.get('cycle')).toBe('12');
        expect(params.get('fixedPlan')).toBe('true');
        expect(params.get('audience')).toBe(Audience.B2B);
        expect(params.get('target')).toBeNull();
    });

    it.each(['checkout', 'compare'] as const)('drops target=%s for free users', (target) => {
        expect(getUpgradePath({ user: freeUser, app: APPS.PROTONMAIL, target })).toBe('/upgrade');
    });

    it('defaults paid users to /dashboard with plan and target=compare', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const path = getUpgradePath({ user: paidUser, app: APPS.PROTONMAIL, subscription });
        const params = new URLSearchParams(path.split('?')[1]);

        expect(path.startsWith('/dashboard?')).toBe(true);
        expect(params.get('plan')).toBe('mail2022');
        expect(params.get('target')).toBe('compare');
    });

    it('falls back to bundle when a paid user has no plan param or subscription plan', () => {
        const path = getUpgradePath({ user: paidUser, app: APPS.PROTONMAIL });
        const params = new URLSearchParams(path.split('?')[1]);

        expect(params.get('plan')).toBe(PLANS.BUNDLE);
        expect(params.get('target')).toBe('compare');
    });

    it('honors an explicit target for paid users', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const params = new URLSearchParams(
            getUpgradePath({ user: paidUser, app: APPS.PROTONMAIL, subscription, target: 'checkout' }).split('?')[1]
        );

        expect(params.get('target')).toBe('checkout');
    });

    it('prefers an explicit plan over the subscription plan for paid users', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const params = new URLSearchParams(
            getUpgradePath({ user: paidUser, app: APPS.PROTONMAIL, subscription, plan: PLANS.DRIVE }).split('?')[1]
        );

        expect(params.get('plan')).toBe(PLANS.DRIVE);
    });

    it('passes cycle bounds through for paid users', () => {
        const params = new URLSearchParams(
            getUpgradePath({
                user: paidUser,
                app: APPS.PROTONMAIL,
                minimumCycle: CYCLE.MONTHLY,
                maximumCycle: CYCLE.TWO_YEARS,
            }).split('?')[1]
        );

        expect(params.get('minimumCycle')).toBe('1');
        expect(params.get('maximumCycle')).toBe('24');
    });
});
