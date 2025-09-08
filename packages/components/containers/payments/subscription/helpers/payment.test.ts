import { COUPON_CODES, CYCLE, FREE_SUBSCRIPTION, PLANS, Renew } from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { getAutoCoupon, notHigherThanAvailableOnBackend, subscriptionExpires } from './payment';

describe('subscriptionExpires()', () => {
    it('should handle the case when subscription is not loaded yet', () => {
        expect(subscriptionExpires()).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle the case when subscription is free', () => {
        expect(subscriptionExpires(FREE_SUBSCRIPTION as any)).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle non-expiring subscription', () => {
        expect(subscriptionExpires(buildSubscription())).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle expiring subscription', () => {
        const subscription = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription expires', () => {
        const subscription = buildSubscription();
        const upcoming = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });
        subscription.UpcomingSubscription = upcoming;

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: upcoming.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription does not expire', () => {
        const subscription = buildSubscription();
        const upcoming = buildSubscription(undefined, {
            Renew: Renew.Enabled,
        });
        subscription.UpcomingSubscription = upcoming;

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should ignore upcoming subscription if the current subscription is cancelled', () => {
        const subscription = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });
        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
            planName: 'Proton Unlimited',
        });

        expect(subscriptionExpires(subscription, true)).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
            planName: 'Proton Unlimited',
        });
    });
});

describe('notHigherThanAvailableOnBackend', () => {
    it('should return current cycle if plan does not exist in the planIDs', () => {
        expect(notHigherThanAvailableOnBackend({}, PLANS_MAP, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it('should return current cycle if plan does not exist in the plansMap', () => {
        expect(notHigherThanAvailableOnBackend({ [PLANS.MAIL]: 1 }, {}, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it.each([CYCLE.MONTHLY, CYCLE.THIRTY, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY])(
        'should return current cycle if it is not higher than available on backend',
        (cycle) => {
            expect(notHigherThanAvailableOnBackend({ [PLANS.VPN2024]: 1 }, PLANS_MAP, cycle)).toEqual(cycle);
        }
    );

    it.each([
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.THIRTY,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.DRIVE_1TB,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.DRIVE_1TB,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
    ])('should cap cycle if the backend does not have available higher cycles', ({ plan, cycle, expected }) => {
        expect(notHigherThanAvailableOnBackend({ [plan]: 1 }, PLANS_MAP, cycle)).toEqual(expected);
    });
});

describe('getAutoCoupon', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // Set default date - can be overridden in individual tests with jest.setSystemTime()
        jest.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('trial scenarios', () => {
        it('should return existing coupon when trial is true', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                trial: true,
                coupon: 'EXISTING_COUPON',
            });
            expect(result).toBe('EXISTING_COUPON');
        });

        it('should return undefined when trial is true and no coupon provided', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                trial: true,
            });
            expect(result).toBeUndefined();
        });
    });

    describe('VPN auto coupon logic', () => {
        it('should return existing coupon if one is already provided', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                coupon: 'EXISTING_COUPON',
            });
            expect(result).toBe('EXISTING_COUPON');
        });

        it('should return undefined for non-VPN plans', () => {
            const result = getAutoCoupon({
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                planIDs: { [PLANS.MAIL]: 1 },
            });
            expect(result).toBeUndefined();
        });

        it('should return undefined for monthly cycle', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                currency: 'USD',
                cycle: CYCLE.MONTHLY,
            });
            expect(result).toBeUndefined();
        });

        describe('date-based coupon selection', () => {
            it('should return VPN_INTRO_2024 before 2025-09-10', () => {
                jest.setSystemTime(new Date('2025-09-09T10:00:00.000Z'));

                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    cycle: CYCLE.YEARLY,
                    currency: 'USD',
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2024);
            });

            it('should return VPN_INTRO_2025_UK after 2025-09-10 for GBP currency', () => {
                jest.setSystemTime(new Date('2025-09-15T10:00:00.000Z'));

                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    cycle: CYCLE.YEARLY,
                    currency: 'GBP',
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2025_UK);
            });

            it('should return VPN_INTRO_2024 after 2025-09-10 for non-GBP currency', () => {
                jest.setSystemTime(new Date('2025-09-15T10:00:00.000Z'));

                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    cycle: CYCLE.YEARLY,
                    currency: 'USD',
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2024);
            });

            it('should return VPN_INTRO_2025 after 2025-09-25', () => {
                jest.setSystemTime(new Date('2025-09-26T10:00:00.000Z'));

                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    cycle: CYCLE.YEARLY,
                    currency: 'USD',
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2025);
            });

            it('should return VPN_INTRO_2025 after 2025-09-25 even for GBP currency', () => {
                jest.setSystemTime(new Date('2025-09-26T10:00:00.000Z'));

                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    cycle: CYCLE.YEARLY,
                    currency: 'GBP',
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2025);
            });
        });

        describe('cycle requirements', () => {
            it.each([CYCLE.YEARLY, CYCLE.TWO_YEARS])('should work for %s cycle', (cycle) => {
                const result = getAutoCoupon({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    currency: 'USD',
                    cycle,
                });
                expect(result).toBe(COUPON_CODES.VPN_INTRO_2024);
            });

            it.each([CYCLE.MONTHLY, CYCLE.SIX, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.THIRTY])(
                'should not work for %s cycle',
                (cycle) => {
                    const result = getAutoCoupon({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        currency: 'USD',
                        cycle,
                    });
                    expect(result).toBeUndefined();
                }
            );
        });
    });

    describe('edge cases', () => {
        it('should handle null coupon', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                coupon: null,
            });
            expect(result).toBe(COUPON_CODES.VPN_INTRO_2024);
        });

        it('should handle empty string coupon', () => {
            const result = getAutoCoupon({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
                coupon: '',
            });
            expect(result).toBe(COUPON_CODES.VPN_INTRO_2024);
        });
    });
});
