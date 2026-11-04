import type { UserModel } from '../../lib/interfaces/User';
import { FREE_SUBSCRIPTION, PLANS } from '../../lib/payments/constants';
import type { Subscription } from '../../lib/payments/subscription/interface';
import { getCanAddStorage } from '../../lib/user/storage';

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
