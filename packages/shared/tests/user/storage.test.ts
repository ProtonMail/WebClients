import type { UserModel } from '../../lib/interfaces/User';
import { FREE_SUBSCRIPTION, PLANS } from '../../lib/payments/constants';
import type { Subscription } from '../../lib/payments/subscription/interface';
import { sizeUnits } from '../../lib/helpers/size';
import { SpaceState, getCanAddStorage, getSpaceDetails } from '../../lib/user/storage';

const freeUser = { isFree: true, isMember: false, canPay: true } as UserModel;
const paidUser = { isFree: false, isMember: false, canPay: true } as UserModel;

const buildSubscription = (plan: PLANS) => ({ Plans: [{ Name: plan }] }) as Subscription;

describe('getCanAddStorage', () => {
    it('lets a free user add storage without a subscription', () => {
        expect(getCanAddStorage({ user: freeUser, subscription: undefined })).toBe(true);
    });

    it('lets a free user add storage with the free subscription', () => {
        expect(getCanAddStorage({ user: freeUser, subscription: FREE_SUBSCRIPTION })).toBe(true);
    });

    it('does not let a paid user add storage before the subscription is known', () => {
        expect(getCanAddStorage({ user: paidUser, subscription: undefined })).toBe(false);
    });

    it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.DRIVE, PLANS.VPN2024] as const)('lets a %s user add storage', (plan) => {
        expect(getCanAddStorage({ user: paidUser, subscription: buildSubscription(plan) })).toBe(true);
    });

    it.each([PLANS.VISIONARY, PLANS.MAIL_PRO] as const)('does not let a %s user add storage', (plan) => {
        expect(getCanAddStorage({ user: paidUser, subscription: buildSubscription(plan) })).toBe(false);
    });

    it('does not let a member add storage', () => {
        expect(getCanAddStorage({ user: { ...freeUser, isMember: true }, subscription: undefined })).toBe(false);
    });

    it('does not let a user who cannot pay add storage', () => {
        expect(getCanAddStorage({ user: { ...freeUser, canPay: false }, subscription: undefined })).toBe(false);
    });
});

describe('getSpaceDetails', () => {
    const { GB, TB } = sizeUnits;

    it.each([
        // Small plans: the 20% relative threshold applies
        { used: 0, max: 1 * GB, expected: SpaceState.Good },
        { used: 0.79 * GB, max: 1 * GB, expected: SpaceState.Good },
        { used: 0.85 * GB, max: 1 * GB, expected: SpaceState.Warning },
        { used: 1 * GB, max: 1 * GB, expected: SpaceState.Danger },
        { used: 2 * GB, max: 1 * GB, expected: SpaceState.Danger },
        // 100 GB plan: 20% = 20 GB, both thresholds are equal
        { used: 79 * GB, max: 100 * GB, expected: SpaceState.Good },
        { used: 80 * GB, max: 100 * GB, expected: SpaceState.Warning },
        { used: 81 * GB, max: 100 * GB, expected: SpaceState.Warning },
        // Large plans: the 20 GB absolute threshold applies
        { used: 1.6 * TB, max: 2 * TB, expected: SpaceState.Good },
        { used: 3 * TB - 25 * GB, max: 3 * TB, expected: SpaceState.Good },
        { used: 3 * TB - 20 * GB, max: 3 * TB, expected: SpaceState.Warning },
        { used: 3 * TB - 19 * GB, max: 3 * TB, expected: SpaceState.Warning },
        { used: 3 * TB, max: 3 * TB, expected: SpaceState.Danger },
    ])('returns $expected for $used / $max', ({ used, max, expected }) => {
        expect(getSpaceDetails(used, max).type).toBe(expected);
    });

    it('treats an empty account with no storage as good', () => {
        expect(getSpaceDetails(0, 0).type).toBe(SpaceState.Good);
    });
});
