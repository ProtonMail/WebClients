import { buildUser } from '@proton/account/testing/buildUser';
import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { Renew, SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { getSubscriptionRenewData, getSubscriptionRows } from './getSubscriptionRows';

const getRows = (user: UserModel, subscription: Subscription) => getSubscriptionRows(user, [subscription]);

describe('getSubscriptionRows', () => {
    const paidUser = buildUser({ isPaid: true, isFree: false, hasPassLifetime: false });

    const withId = (sub: Subscription, ID: string): Subscription => ({ ...sub, ID });

    // Removing seats is the transition that keeps the upcoming term on its own row: same plan, different content.
    const withMembers = (quantity: number, ID: string) =>
        withId(buildSubscription({ [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: quantity }), ID);

    it('returns a single current row when there is no upcoming and no secondaries', () => {
        const subscription = withId(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            'sub-current'
        );

        const rows = getRows(paidUser, subscription);

        expect(rows).toHaveLength(1);
        expect(rows[0].kind).toBe('current');
        expect(rows[0].subscription).toBe(subscription);
        expect(rows[0].id).toBe('sub-current-current');
        expect(rows[0].planTitle).toBe(PLAN_NAMES[PLANS.BUNDLE]);
        expect(rows[0].renewAmount).toBe(subscription.RenewAmount);
        expect(rows[0].renewCurrency).toBe(subscription.Currency);
        expect(rows[0].renewCycle).toBe(subscription.RenewCycle);
        expect(rows[0].startDate).toBe(subscription.PeriodStart);
        expect(rows[0].endDate).toBe(subscription.PeriodEnd);
    });

    it('returns current + upcoming rows when the upcoming term drops addons', () => {
        const upcoming = withMembers(1, 'sub-upcoming');
        const subscription: Subscription = {
            ...withMembers(3, 'sub-current'),
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.kind)).toEqual(['current', 'upcoming']);
        expect(rows[0].subscription).toBe(subscription);
        expect(rows[0].hasSeparateUpcomingRow).toBe(true);
        expect(rows[0].scheduledChange).toBeUndefined();
        expect(rows[1].subscription).toBe(upcoming);
        expect(rows[1].parent).toBe(subscription);
        expect(rows[1].id).toBe('sub-upcoming-upcoming');
        expect(rows[1].startDate).toBe(upcoming.PeriodStart);
        expect(rows[1].endDate).toBe(upcoming.PeriodEnd);
    });

    it('folds a same-plan upcoming into a single current row carrying a scheduledChange', () => {
        const upcoming = withId(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            'up'
        );
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.MONTHLY, currency: 'EUR' }), 'cur'),
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.kind)).toEqual(['current']);
        expect(rows[0].hasSeparateUpcomingRow).toBe(false);
        expect(rows[0].scheduledChange).toBeDefined();
    });

    it('returns one current row per subscription of the list', () => {
        const first = withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'a');
        const second = withId(buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'b');

        const rows = getSubscriptionRows(paidUser, [first, second]);

        expect(rows.map((r) => r.kind)).toEqual(['current', 'current']);
        expect(rows.map((r) => r.id)).toEqual(['a-current', 'b-current']);
    });

    it('expands the upcoming subscription of every subscription of the list', () => {
        const firstUpcoming = withMembers(1, 'a-up');
        const secondUpcoming = withMembers(2, 'b-up');
        const first: Subscription = { ...withMembers(3, 'a'), UpcomingSubscription: firstUpcoming };
        const second: Subscription = { ...withMembers(4, 'b'), UpcomingSubscription: secondUpcoming };

        const rows = getSubscriptionRows(paidUser, [first, second]);

        expect(rows.map((r) => r.kind)).toEqual(['current', 'upcoming', 'current', 'upcoming']);
        expect(rows[3].subscription).toBe(secondUpcoming);
        expect(rows[3].parent).toBe(second);
    });

    it('folds a same plan/same cycle coupon renewal as an amount-change using RenewAmount', () => {
        const upcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'up'),
            IsPrepaid: true,
            Amount: 5000,
            Discount: 6988,
            RenewAmount: 11988,
            BaseRenewAmount: 11988,
        };
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            UpcomingSubscription: upcoming,
        };

        const [currentRow] = getRows(paidUser, subscription);

        expect(currentRow.kind).toBe('current');
        expect(currentRow.scheduledChange).toMatchObject({
            kind: 'amount-change',
            recurringAmount: 11988,
            nextCurrency: 'EUR',
            nextCycle: CYCLE.YEARLY,
        });
        expect(currentRow.billingType).toBe('prepaid');
    });

    it('folds an unpaid cycle change (24m → 12m, billed at renewal) using Amount || BaseRenewAmount', () => {
        const upcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'up'),
            IsPrepaid: false,
            Amount: 0,
            BaseRenewAmount: 11988,
            RenewAmount: 0,
        };
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS, currency: 'EUR' }), 'cur'),
            UpcomingSubscription: upcoming,
        };

        const [currentRow] = getRows(paidUser, subscription);

        expect(currentRow.scheduledChange).toMatchObject({
            kind: 'unpaid-change',
            recurringAmount: 11988,
            nextCycle: CYCLE.YEARLY,
        });
        expect(currentRow.billingType).toBe('billed-at-renewal');
    });

    it('folds a same-plan prepaid upgrade to a longer cycle as a prepaid-upgrade', () => {
        const upcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS, currency: 'EUR' }), 'up'),
            IsPrepaid: true,
        };
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            UpcomingSubscription: upcoming,
        };

        const [currentRow] = getRows(paidUser, subscription);

        expect(currentRow.scheduledChange?.kind).toBe('prepaid-upgrade');
        expect(currentRow.scheduledChange?.nextCycle).toBe(CYCLE.TWO_YEARS);
        expect(currentRow.billingType).toBe('prepaid');
    });

    it('P2-2146: folds Pass yearly PASS12M1 into one current row billed at renewal', () => {
        // The ticket case (UID 52133389): a Pass yearly coupon carried on a same-plan/same-cycle upcoming, which is
        // unpaid — so its Amount is still 0. Which field then holds the discounted charge is unresolved (RenewAmount
        // is documented as the charge for the term *after* this one), so the quoted price is deliberately not
        // asserted here; see the ticket.
        const upcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.PASS, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'up'),
            IsPrepaid: false,
            CouponCode: 'PASS12M1',
            Amount: 0,
            RenewAmount: 1200,
            BaseRenewAmount: 3588,
        };
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.PASS, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            IsPrepaid: false,
            Amount: 1200,
            RenewAmount: 1200,
            BaseRenewAmount: 3588,
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.kind)).toEqual(['current']);
        expect(rows[0].price).toBe(1200);
        expect(rows[0].scheduledChange).toMatchObject({ kind: 'amount-change', nextCycle: CYCLE.YEARLY });
        expect(rows[0].billingType).toBe('billed-at-renewal');
    });

    it('bills the current term as prepaid even though the API reports IsPrepaid false for it', () => {
        // The active subscription always has an invoice; the API only populates IsPrepaid for upcoming terms.
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            IsPrepaid: false,
        };

        expect(getRows(paidUser, subscription)[0].billingType).toBe('prepaid');
    });

    it('bills a trial at renewal: no invoice exists until it turns into a paid term', () => {
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            IsPrepaid: false,
            IsTrial: true,
        };

        expect(getRows(paidUser, subscription)[0].billingType).toBe('billed-at-renewal');
    });

    // A trial reports Amount 0 with no Discount and RenewCycle null — the shape the price/renewal heuristics
    // would otherwise read as "not priced yet" and "variable cycle offer".
    const trial: Subscription = {
        ...buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.MONTHLY, currency: 'CHF' }),
        ID: 'trial',
        IsTrial: true,
        IsPrepaid: false,
        Amount: 0,
        Discount: 0,
        RenewAmount: 499,
        BaseRenewAmount: 499,
        RenewCycle: null,
    };

    it('prices a trial term at 0 rather than falling back to BaseRenewAmount', () => {
        expect(getRows(paidUser, trial)[0].price).toBe(0);
    });

    it('still announces the renewal of a trial, whose null RenewCycle is not a cycle change', () => {
        const [row] = getRows(paidUser, trial);

        expect(row.hideRenewalText).toBe(false);
        expect(row.renewCycle).toBe(CYCLE.MONTHLY);
        expect(row.renewalText?.primary?.replace(/ /g, ' ')).toBe('Renews automatically at CHF 4.99, for 1 month');
    });

    it('price field on the current row is its own Amount (what was paid for this term)', () => {
        const upcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'up'),
            Amount: 958,
            BaseRenewAmount: 4788,
        };
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            Amount: 5000,
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);

        expect(rows).toHaveLength(1);
        expect(rows[0].price).toBe(5000);
    });

    it('hideRenewalText is true when shouldHaveUpcomingSubscription is true and there is no UpcomingSubscription', () => {
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS, currency: 'EUR' }), 'cur'),
            RenewCycle: CYCLE.YEARLY,
        };

        const [currentRow] = getRows(paidUser, subscription);

        expect(currentRow.hideRenewalText).toBe(true);
    });

    it('hideRenewalText is false on the current row when an UpcomingSubscription is present', () => {
        const upcoming = withId(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            'up'
        );
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.TWO_YEARS, currency: 'EUR' }), 'cur'),
            RenewCycle: CYCLE.YEARLY,
            UpcomingSubscription: upcoming,
        };

        const [currentRow] = getRows(paidUser, subscription);

        expect(currentRow.hideRenewalText).toBe(false);
    });

    it('propagates isLifetime, isManagedExternally, isExpiring and showReactivate flags', () => {
        const expiringExternal: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            Renew: Renew.Disabled,
            External: SubscriptionPlatform.Android,
        };

        const externalRow = getRows(paidUser, expiringExternal)[0];
        expect(externalRow.isExpiring).toBe(true);
        expect(externalRow.isManagedExternally).toBe(true);
        // showReactivate must be suppressed for externally managed subs
        expect(externalRow.showReactivate).toBe(false);

        const expiringDefault: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            Renew: Renew.Disabled,
        };
        const defaultRow = getRows(paidUser, expiringDefault)[0];
        expect(defaultRow.isExpiring).toBe(true);
        expect(defaultRow.showReactivate).toBe(true);

        const lifetime: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }), 'cur'),
            CouponCode: COUPON_CODES.LIFETIME,
        };
        const lifetimeRow = getRows(paidUser, lifetime)[0];
        expect(lifetimeRow.isLifetime).toBe(true);
    });

    it('an upcoming row never shows the reactivate action', () => {
        const upcoming: Subscription = { ...withMembers(1, 'up'), Renew: Renew.Disabled };
        const subscription: Subscription = { ...withMembers(3, 'cur'), UpcomingSubscription: upcoming };

        const upcomingRow = getRows(paidUser, subscription).find((r) => r.kind === 'upcoming')!;

        expect(upcomingRow.showReactivate).toBe(false);
    });

    it('start and end dates use the row subscription own PeriodStart / PeriodEnd', () => {
        const upcoming: Subscription = {
            ...withMembers(1, 'up'),
            PeriodStart: 2_000_000_000,
            PeriodEnd: 2_100_000_000,
        };
        const subscription: Subscription = {
            ...withMembers(3, 'cur'),
            PeriodStart: 1_000_000_000,
            PeriodEnd: 2_000_000_000,
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);
        const currentRow = rows.find((r) => r.kind === 'current')!;
        const upcomingRow = rows.find((r) => r.kind === 'upcoming')!;

        expect(currentRow.startDate).toBe(subscription.PeriodStart);
        expect(currentRow.endDate).toBe(subscription.PeriodEnd);
        expect(upcomingRow.startDate).toBe(upcoming.PeriodStart);
        expect(upcomingRow.endDate).toBe(upcoming.PeriodEnd);
    });

    it('hasSeparateUpcomingRow is true on the current row when an upcoming row will be rendered', () => {
        const subscription: Subscription = {
            ...withMembers(3, 'cur'),
            UpcomingSubscription: withMembers(1, 'up'),
        };

        const rows = getRows(paidUser, subscription);
        const currentRow = rows.find((r) => r.kind === 'current')!;
        const upcomingRow = rows.find((r) => r.kind === 'upcoming')!;

        expect(currentRow.hasSeparateUpcomingRow).toBe(true);
        expect(currentRow.scheduledChange).toBeUndefined();
        expect(upcomingRow.hasSeparateUpcomingRow).toBe(false);
    });

    it('hasSeparateUpcomingRow is false when no upcoming exists, or when the upcoming row is suppressed by Renew.Disabled', () => {
        const lonely = withId(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            'cur'
        );
        expect(getRows(paidUser, lonely)[0].hasSeparateUpcomingRow).toBe(false);

        const cancelledWithUpcoming: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.MONTHLY, currency: 'EUR' }), 'cur'),
            Renew: Renew.Disabled,
            UpcomingSubscription: withId(
                buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
                'up'
            ),
        };
        expect(getRows(paidUser, cancelledWithUpcoming)[0].hasSeparateUpcomingRow).toBe(false);
    });

    it('keeps a separate row for an addon downgrade: the upcoming term has a different content, not just a price', () => {
        const subscription: Subscription = {
            ...withMembers(3, 'cur'),
            UpcomingSubscription: {
                ...withMembers(1, 'up'),
                IsPrepaid: false,
                Amount: 0,
                RenewAmount: 0,
                BaseRenewAmount: 50000,
            },
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.kind)).toEqual(['current', 'upcoming']);
        expect(rows[0].scheduledChange).toBeUndefined();
        expect(rows[1].renewAmount).toBe(50000);
    });

    it('prices an unpaid upcoming row at what it will cost, not at its uncomputed Amount of 0', () => {
        // UID 52133389: an addon this term, the plan alone next term, charged 119.88 when that term starts.
        const subscription: Subscription = {
            ...withMembers(3, 'cur'),
            Amount: 23976,
            RenewAmount: 11988,
            BaseRenewAmount: 23976,
            UpcomingSubscription: {
                ...withMembers(1, 'up'),
                IsPrepaid: false,
                Amount: 0,
                RenewAmount: 0,
                BaseRenewAmount: 11988,
            },
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.price)).toEqual([23976, 11988]);
    });

    it('suppresses the upcoming row when the parent subscription has renew disabled', () => {
        // When renew is disabled the upcoming subscription is effectively canceled — don't surface it as a row.
        const upcoming = withId(
            buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            'up'
        );
        const subscription: Subscription = {
            ...withId(buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.MONTHLY, currency: 'EUR' }), 'cur'),
            Renew: Renew.Disabled,
            UpcomingSubscription: upcoming,
        };

        const rows = getRows(paidUser, subscription);

        expect(rows.map((r) => r.kind)).toEqual(['current']);
    });
});

describe('getSubscriptionRenewData', () => {
    it('returns RenewAmount for a current term (keeps a permanent discount)', () => {
        const subscription: Subscription = {
            ...buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'EUR' }),
            RenewAmount: 909,
            BaseRenewAmount: 1299,
        };

        expect(getSubscriptionRenewData(subscription, false)).toEqual({
            nextChargeAmount: 909,
            nextChargeCycle: subscription.RenewCycle,
            recurringAmount: 909,
            recurringCycle: subscription.RenewCycle,
            renewCurrency: 'EUR',
        });
    });

    it('returns Amount (next charge) and RenewAmount (recurring) for a prepaid upcoming term', () => {
        const upcoming: Subscription = {
            ...buildSubscription({ planName: PLANS.PASS, cycle: CYCLE.MONTHLY, currency: 'EUR' }),
            IsPrepaid: true,
            Amount: 499,
            Discount: 500,
            RenewAmount: 999,
            BaseRenewAmount: 999,
        };

        expect(getSubscriptionRenewData(upcoming, true)).toMatchObject({
            nextChargeAmount: 499,
            recurringAmount: 999,
            renewCurrency: 'EUR',
        });
    });

    it('falls back to BaseRenewAmount for both lines of an unpaid upcoming term whose Amount is still 0', () => {
        const upcoming: Subscription = {
            ...buildSubscription({ planName: PLANS.PASS, cycle: CYCLE.MONTHLY, currency: 'EUR' }),
            IsPrepaid: false,
            Amount: 0,
            RenewAmount: 0,
            BaseRenewAmount: 999,
        };

        expect(getSubscriptionRenewData(upcoming, true)).toMatchObject({
            nextChargeAmount: 999,
            recurringAmount: 999,
        });
    });

    it('reads RenewAmount and RenewCycle as the revert of a priced unpaid upcoming term', () => {
        const upcoming: Subscription = {
            ...buildSubscription({ planName: PLANS.VPN2024, cycle: CYCLE.TWO_YEARS, currency: 'CHF' }),
            IsPrepaid: false,
            Amount: 11976,
            RenewAmount: 8388,
            BaseRenewAmount: 11976,
            Cycle: CYCLE.TWO_YEARS,
            RenewCycle: CYCLE.YEARLY,
        };

        expect(getSubscriptionRenewData(upcoming, true)).toMatchObject({
            nextChargeAmount: 11976,
            nextChargeCycle: CYCLE.TWO_YEARS,
            recurringAmount: 8388,
            recurringCycle: CYCLE.YEARLY,
        });
    });

    it('keeps a genuinely free unpaid upcoming term at 0', () => {
        const upcoming: Subscription = {
            ...buildSubscription({ planName: PLANS.PASS, cycle: CYCLE.MONTHLY, currency: 'EUR' }),
            IsPrepaid: false,
            Amount: 0,
            RenewAmount: 0,
            BaseRenewAmount: 0,
        };

        expect(getSubscriptionRenewData(upcoming, true)).toMatchObject({ nextChargeAmount: 0, recurringAmount: 0 });
    });
});
