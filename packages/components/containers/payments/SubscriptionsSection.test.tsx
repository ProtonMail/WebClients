import { getOrganizationState } from '@proton/account/testing/redux-state';
import { getModelState } from '@proton/account/tests';
import { changeRenewState } from '@proton/payments/core/api/api';
import {
    ADDON_NAMES,
    COUPON_CODES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
    PLAN_TYPES,
} from '@proton/payments/core/constants';
import { Renew, SubscriptionPlatform, TrialType } from '@proton/payments/core/subscription/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { apiMock } from '@proton/test-api/api';

import { plansDefaultResponse } from '../../hooks/helpers/tests/index';
import { renderWithProviders } from '../../testing/renderWithProviders';
import SubscriptionsSection from './SubscriptionsSection';

const mockGetPaymentMethods = jest.fn();
jest.mock('@proton/account/paymentMethods/hooks', () => ({
    useGetPaymentMethods: () => mockGetPaymentMethods,
}));

const withId = (sub: Subscription, ID: string): Subscription => ({ ...sub, ID });

// Removing seats is the transition that keeps the upcoming term on its own row: same plan, different content.
const withMembers = (quantity: number, ID: string): Subscription =>
    withId(
        buildSubscription({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: quantity },
            currency: 'CHF',
            cycle: CYCLE.YEARLY,
        }),
        ID
    );

/**
 * The renewal cell shows up to two lines: a primary "next charge" line and a muted secondary "Then …" line carrying the
 * eventual recurring price. The secondary line appears only when a folded same-plan transition genuinely has two
 * different future prices (an introductory coupon, a free term, or a prepaid term that reverts to full price).
 *
 * | Scenario                                   | Primary line                                    | Secondary (muted)                |
 * | ------------------------------------------ | ----------------------------------------------- | -------------------------------- |
 * | Standalone, no coupon                      | Renews automatically at CHF 12.99, for 1 month  | —                                |
 * | Standalone, forever coupon                 | Renews automatically at CHF 9.09, for 1 month   | —                                |
 * | Standalone, free forever                   | Free renewal                                    | —                                |
 * | Addon-downgrade upcoming row               | Renews automatically at CHF 6.99, for 12 months | —                                |
 * |   …its parent current row                  | Will be replaced by your upcoming subscription… | —                                |
 * | Folded, prepaid, cycle change              | Switches to 12 months on DATE (CHF 119.88 already paid) | Then … (only if it reverts) |
 * | Folded, prepaid, coupon term (P2-2146)     | Renews automatically at CHF 83.92, for 12 months| Then CHF 119.88, for 12 months   |
 * | Folded, prepaid, 100% coupon term          | Free renewal                                    | Then CHF 12.99, for 1 month      |
 * | Folded, prepaid, recurring coupon          | Renews automatically at CHF 12, for 12 months   | — (RenewAmount stays discounted) |
 * | Folded, unpaid term (Amount not charged yet)| Renews automatically at CHF 119.88, for 12 months, on DATE | — (no known revert)  |
 * | Folded, unpaid term, priced, reverts       | Renews automatically at CHF 119.76, for 24 months, on DATE | Then CHF 83.88, for 12 months |
 * | Folded, no coupon (term price == full)     | Renews automatically at CHF 119.88, for 12 months, on DATE | — (amounts equal)    |
 * | Lifetime coupon                            | Lifetime accounts can be transferred or sold    | —                                |
 * | Expiring (renew disabled)                  | (no renewal notice)                             | —                                |
 */
describe('SubscriptionsSection', () => {
    let subscription: Subscription;
    let yearlySub: Subscription;
    let upcoming: Subscription;
    let upcomingYearlySub: Subscription;

    beforeEach(() => {
        subscription = withId(
            buildSubscription(
                {
                    planName: PLANS.BUNDLE,
                    currency: 'CHF',
                    cycle: CYCLE.MONTHLY,
                },
                {
                    PeriodStart: 1696561158,
                    PeriodEnd: 1699239558,
                    CreateTime: 1696561161,
                }
            ),
            'sub-current'
        );

        upcoming = withId(
            buildSubscription(
                {
                    planName: PLANS.BUNDLE,
                    currency: 'CHF',
                    cycle: CYCLE.YEARLY,
                },
                {
                    PeriodStart: 1699239558,
                    PeriodEnd: 1730861958,
                    CreateTime: 1696561195,
                }
            ),
            'sub-upcoming'
        );

        yearlySub = withId(
            buildSubscription(
                {
                    planName: PLANS.BUNDLE,
                    currency: 'CHF',
                    cycle: CYCLE.YEARLY,
                },
                {
                    PeriodStart: 1696561158,
                    PeriodEnd: 1728097158,
                    CreateTime: 1696561161,
                }
            ),
            'sub-current'
        );

        upcomingYearlySub = withId(
            buildSubscription(
                {
                    planName: PLANS.BUNDLE,
                    currency: 'CHF',
                    cycle: CYCLE.YEARLY,
                },
                {
                    PeriodStart: 1728097158,
                    PeriodEnd: 1759633158,
                    CreateTime: 1728097161,
                }
            ),
            'sub-upcoming'
        );

        jest.clearAllMocks();
        mockGetPaymentMethods.mockResolvedValue([{ ID: 'pm1' }]);
    });

    const defaultPlansState = {
        ...getModelState({ plans: plansDefaultResponse.Plans, freePlan: FREE_PLAN }),
        meta: { fetchedAt: Date.now(), fetchedEphemeral: true },
    };

    it('should render current subscription', () => {
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planStartTimeId')).toHaveTextContent('October 6th, 2023');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2023');
    });

    it('should display Expiring badge if renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planNameId')).toHaveTextContent('Proton Unlimited');
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Expiring');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2023');
    });

    it('folds a same-plan upgrade into a single row explaining the prepaid switch', () => {
        subscription.UpcomingSubscription = upcoming;

        const { getAllByTestId, getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        // Same plan (BUNDLE monthly → yearly): one row, no separate "Upcoming" row.
        expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
        expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
        expect(getByTestId('planEndTimeId')).toHaveTextContent('November 6th, 2023');
        expect(getByTestId('renewalNotice')).toHaveTextContent(
            'Switches to 12 months on November 6th, 2023 (CHF 119.88 already paid)'
        );
    });

    it('folds a same plan/same cycle renewal into a single row', () => {
        yearlySub.UpcomingSubscription = upcomingYearlySub;

        const { getAllByTestId, getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });

        expect(getAllByTestId('planEndTimeId')).toHaveLength(1);
        expect(getByTestId('planEndTimeId')).toHaveTextContent('October 5th, 2024');
    });

    it('should show renewal notice if there is no upcoming subscription', () => {
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 12.99, for 1 month');
    });

    it('folds a same plan/same cycle discount coupon as an amount-change: discounted now, full price after', () => {
        // 30% off for one term: Amount discounted, RenewAmount the full price it reverts to.
        upcomingYearlySub.Amount = 8392;
        upcomingYearlySub.Discount = 3596;
        upcomingYearlySub.RenewAmount = 11988;

        yearlySub.UpcomingSubscription = upcomingYearlySub;
        const { getAllByTestId, getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });
        expect(getAllByTestId('renewalNotice')).toHaveLength(1);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 83.92, for 12 months');
        expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 119.88, for 12 months');
    });

    it('folds a same plan/same cycle 100% discount coupon as a "Free renewal"', () => {
        // A forever 100% coupon: the upcoming term and every term after it are free.
        upcomingYearlySub.Amount = 0;
        upcomingYearlySub.Discount = 11988;
        upcomingYearlySub.RenewAmount = 0;
        upcomingYearlySub.BaseRenewAmount = 0;

        yearlySub.UpcomingSubscription = upcomingYearlySub;
        const { getAllByTestId, getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(yearlySub),
                plans: defaultPlansState,
            },
        });
        expect(getAllByTestId('renewalNotice')).toHaveLength(1);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Free renewal');
    });

    it('P2-2146 regression: coupon PASS12M1 (Pass yearly, renews at the discounted price) folds to one row', () => {
        // The ticket case (UID 52133389): a Pass yearly coupon whose renewal is the discounted CHF 12/yr.
        const passYearly = withId(
            buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.YEARLY }),
            'sub-current'
        );
        passYearly.RenewAmount = 1200;
        passYearly.BaseRenewAmount = 3588;
        passYearly.UpcomingSubscription = {
            ...withId(
                buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.YEARLY }),
                'sub-upcoming'
            ),
            CouponCode: 'PASS12M1',
            Amount: 1200,
            RenewAmount: 1200,
            BaseRenewAmount: 3588,
        };

        const { getAllByTestId, getByTestId, queryByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(passYearly),
                plans: defaultPlansState,
            },
        });

        expect(getAllByTestId('renewalNotice')).toHaveLength(1);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 12, for 12 months');
        // PASS12M1 recurs: RenewAmount stays at the discounted CHF 12, so there is nothing to revert to.
        expect(queryByTestId('renewalNoticeSecondary')).not.toBeInTheDocument();
    });

    it('should not show renewal notice if subscription is expiring', () => {
        subscription.Renew = Renew.Disabled;
        const { container } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(container).not.toHaveTextContent('Renews automatically');
    });

    it('should display Reactivate button when Renew is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByText('Reactivate')).toBeInTheDocument();
    });

    it('should display warning icon when renewal is disabled', () => {
        subscription.Renew = Renew.Disabled;
        const { queryByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(queryByTestId('periodEndWarning')).toBeInTheDocument();
    });

    it('should suppress the upcoming row when renew is disabled on the current subscription', () => {
        subscription.Renew = Renew.Disabled;
        subscription.UpcomingSubscription = upcoming;
        const { getAllByTestId, container } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
        // The "Upcoming" badge must not appear
        expect(container).not.toHaveTextContent('Upcoming');
    });

    it('should call API when user presses reactivate button', async () => {
        subscription.Renew = Renew.Disabled;

        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        getByText('Reactivate').click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockGetPaymentMethods).toHaveBeenCalled();
        expect(apiMock).toHaveBeenCalledWith(
            changeRenewState({
                RenewalState: Renew.Enabled,
            })
        );
    });

    it('should not call API when user presses reactivate button for referral trial without payment methods', async () => {
        subscription.Renew = Renew.Disabled;
        subscription.TrialType = TrialType.ReferralProgram;
        subscription.IsTrial = true;
        mockGetPaymentMethods.mockResolvedValue([]);

        const { getByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        getByText('Reactivate').click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockGetPaymentMethods).toHaveBeenCalled();
        expect(apiMock).not.toHaveBeenCalled();
    });

    it('shows "Will be replaced by your upcoming subscription on DATE" on the current row when an upcoming row is rendered', () => {
        // The two-row layout: the current row says it will be replaced, the upcoming row shows its own renewal.
        const downgrading: Subscription = {
            ...withMembers(3, 'sub-current'),
            UpcomingSubscription: {
                ...withMembers(1, 'sub-upcoming'),
                PeriodStart: upcoming.PeriodStart,
                PeriodEnd: upcoming.PeriodEnd,
            },
        };
        const { getAllByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(downgrading),
                plans: defaultPlansState,
            },
        });
        const notices = getAllByTestId('renewalNotice');
        expect(notices).toHaveLength(2);
        expect(notices[0]).toHaveTextContent('Will be replaced by your upcoming subscription on November 6th, 2023');
        expect(notices[1]).toHaveTextContent('Renews automatically');
    });

    it('keeps two rows for an addon downgrade so the remaining seats are visible', () => {
        const downgrading: Subscription = {
            ...withMembers(3, 'sub-current'),
            UpcomingSubscription: {
                ...withMembers(1, 'sub-upcoming'),
                IsPrepaid: false,
                Amount: 0,
                RenewAmount: 0,
                BaseRenewAmount: 50000,
            },
        };

        const { getAllByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(downgrading),
                plans: defaultPlansState,
            },
        });

        expect(getAllByTestId('subscriptionStatusId').map((el) => el.textContent)).toEqual(['Active', 'Upcoming']);
        const notices = getAllByTestId('renewalNotice');
        expect(notices[0]).toHaveTextContent('Will be replaced by your upcoming subscription on');
        expect(notices[1]).toHaveTextContent('Renews automatically at CHF 500, for 12 months');
    });

    it('shows "Free renewal" when BaseRenewAmount is 0 and there is no upcoming row', () => {
        subscription.BaseRenewAmount = 0;
        subscription.RenewAmount = 0;
        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(getByTestId('renewalNotice')).toHaveTextContent('Free renewal');
    });

    it('shows the discounted RenewAmount for a standalone subscription with a recurring coupon (no upcoming)', () => {
        // Single current subscription with a recurring coupon and no upcoming term: RenewAmount is what the
        // user keeps paying each renewal. With no upcoming to revert to, that discounted amount is shown.
        subscription.Amount = 999;
        subscription.RenewAmount = 999;
        subscription.BaseRenewAmount = 1299;

        const { getByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getByTestId('planPriceId')).toHaveTextContent('CHF 9.99');
        expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 9.99, for 1 month');
    });

    it('folds a 1m → 24m prepaid upgrade into a single row (same plan)', () => {
        // Current term is monthly; the user prepaid a 24-month upcoming of the same plan. It folds into one
        // row explaining the prepaid switch; the upcoming's own nested RenewCycle is not surfaced here.
        const upcoming24m: Subscription = {
            ...withId(
                buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS }),
                'sub-upcoming'
            ),
            Amount: 21998,
            RenewAmount: 21998,
            BaseRenewAmount: 21998,
            Cycle: CYCLE.TWO_YEARS,
            RenewCycle: CYCLE.YEARLY,
        };
        subscription.UpcomingSubscription = upcoming24m;

        const { getAllByTestId, getByTestId, queryByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        expect(getAllByTestId('renewalNotice')).toHaveLength(1);
        expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 24 months');
        // Prepaid 24m term cost CHF 219.98; recurring price matches, so no separate "Then …" line.
        expect(getByTestId('renewalNotice')).toHaveTextContent('(CHF 219.98 already paid)');
        expect(queryByTestId('renewalNoticeSecondary')).not.toBeInTheDocument();
    });

    it.each([[CYCLE.THREE], [CYCLE.SIX], [CYCLE.FIFTEEN], [CYCLE.EIGHTEEN], [CYCLE.THIRTY]])(
        'folds a special-cycle (%s) automatic 12m renewal into a single auto-variable-cycle row',
        (specialCycle) => {
            // Special-cycle current term with an automatic (unpaid) 12-month upcoming. It folds into one
            // row whose renewal line shows the yearly BaseRenewAmount and the transition date.
            const current = withId(
                buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY }),
                'sub-current'
            );
            current.Cycle = specialCycle;
            current.RenewCycle = CYCLE.YEARLY;

            const upcoming12m: Subscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY }),
                    'sub-upcoming'
                ),
                IsPrepaid: false,
                Amount: 11988,
                RenewAmount: 11988,
                BaseRenewAmount: 11988,
                Cycle: CYCLE.YEARLY,
                RenewCycle: CYCLE.YEARLY,
            };
            current.UpcomingSubscription = upcoming12m;

            const { getAllByTestId, getByTestId } = renderWithProviders(<SubscriptionsSection />, {
                preloadedState: {
                    subscription: getSubscriptionState(current),
                    plans: defaultPlansState,
                },
            });

            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent(
                'Renews automatically at CHF 119.88, for 12 months, on'
            );
        }
    );

    it('renders one row per SecondarySubscription with its own plan title', () => {
        const secondary = withId(
            buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.YEARLY }),
            'sub-secondary'
        );
        const root: Subscription = {
            ...subscription,
            SecondarySubscriptions: [secondary],
        };

        const { getAllByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(root),
                plans: defaultPlansState,
            },
        });

        const planNames = getAllByTestId('planNameId').map((el) => el.textContent);
        expect(planNames).toEqual(['Proton Unlimited', 'Pass Plus']);
    });

    it('shows a "View breakdown" link that opens the addon breakdown when the subscription has addons', async () => {
        subscription.Plans = [
            ...subscription.Plans,
            {
                ID: 'addon-member',
                Type: PLAN_TYPES.ADDON,
                Name: '1member',
                Title: 'Additional users',
                Amount: 500,
                Quantity: 2,
                Currency: 'CHF',
                Cycle: CYCLE.MONTHLY,
            } as unknown as Subscription['Plans'][number],
        ];

        const { getByTestId, findByText } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });

        getByTestId('viewBreakdown').click();
        expect(await findByText(/Additional users/)).toBeInTheDocument();
    });

    it('does not show a "View breakdown" link when the subscription has no addons', () => {
        const { queryByTestId } = renderWithProviders(<SubscriptionsSection />, {
            preloadedState: {
                subscription: getSubscriptionState(subscription),
                plans: defaultPlansState,
            },
        });
        expect(queryByTestId('viewBreakdown')).not.toBeInTheDocument();
    });

    // One test per row of the P2-2146 scenario matrix. Rows flagged "BUG" assert the *desired*
    // behavior and are expected to fail until the underlying issue is fixed (TDD red specs).
    describe('scenario matrix', () => {
        const render = (sub: Subscription, organization?: Parameters<typeof getOrganizationState>[0]) =>
            renderWithProviders(<SubscriptionsSection />, {
                preloadedState: {
                    subscription: getSubscriptionState(sub),
                    plans: defaultPlansState,
                    ...(organization ? { organization: getOrganizationState(organization) } : {}),
                },
            });

        it('Row 1 — free subscription: renders nothing, not an infinite loader', () => {
            const { queryByTestId, queryAllByTestId } = renderWithProviders(<SubscriptionsSection />, {
                preloadedState: {
                    subscription: getSubscriptionState(FREE_SUBSCRIPTION as unknown as Subscription),
                    plans: defaultPlansState,
                },
            });
            // A resolved free subscription must not leave the section stuck on a spinner.
            expect(queryByTestId('circle-loader')).not.toBeInTheDocument();
            // No paid rows are rendered for a free user.
            expect(queryAllByTestId('planNameId')).toHaveLength(0);
        });

        it('Row 2 — free → paid (already paid): a single Active paid row is rendered', () => {
            const { getAllByTestId, getByTestId } = render(subscription);
            expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
            expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
            expect(getByTestId('planPriceId')).toHaveTextContent('CHF 12.99');
        });

        it('Row 3 — free → paid (unpaid upcoming): folds to one auto-variable-cycle row at BaseRenewAmount', () => {
            const unpaidUpcoming: Subscription = {
                ...upcoming,
                IsPrepaid: false,
                Amount: 0,
                RenewAmount: 0,
                BaseRenewAmount: 11988,
            };
            subscription.UpcomingSubscription = unpaidUpcoming;
            const { getAllByTestId, getByTestId, queryByTestId } = render(subscription);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            // Amount is 0 because the charge is only computed when the unpaid term starts — the user will pay
            // BaseRenewAmount, so no "free" is announced and there is nothing to revert to afterwards.
            expect(getByTestId('renewalNotice')).toHaveTextContent(
                'Renews automatically at CHF 119.88, for 12 months, on'
            );
            expect(queryByTestId('renewalNoticeSecondary')).not.toBeInTheDocument();
        });

        it('Row 4 — paid → paid, same plan ≠ cycle, prepaid: folds to one prepaid-upgrade row', () => {
            subscription.UpcomingSubscription = upcoming;
            const { getAllByTestId, getByTestId, queryByTestId } = render(subscription);
            expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
            expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Active');
            // No coupon: the prepaid amount equals the recurring price, so no separate "Then …" line.
            expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 12 months');
            expect(getByTestId('renewalNotice')).toHaveTextContent('(CHF 119.88 already paid)');
            expect(queryByTestId('renewalNoticeSecondary')).not.toBeInTheDocument();
        });

        it('Row 5 — paid → paid, same plan ≠ cycle, prepaid coupon (already paid): folds to one prepaid-upgrade row', () => {
            const passYearly = withId(
                buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.YEARLY }),
                'sub-current'
            );
            // Already paid → prepaid upcoming.
            passYearly.UpcomingSubscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.MONTHLY }),
                    'sub-upcoming'
                ),
                Amount: 499,
                Discount: 500,
                RenewAmount: 999,
                BaseRenewAmount: 999,
                RenewCycle: CYCLE.MONTHLY,
            };
            const { getAllByTestId, getByTestId } = render(passYearly);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 1 month');
            // Prepaid term cost CHF 4.99 (coupon), then reverts to the full CHF 9.99 recurring price.
            expect(getByTestId('renewalNotice')).toHaveTextContent('(CHF 4.99 already paid)');
            expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 9.99, for 1 month');
        });

        it('Row 6 — paid → paid, same plan = cycle, no coupon: single row renews at full price', () => {
            const { getByTestId } = render(yearlySub);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 119.88, for 12 months');
        });

        it('Row 7 — paid → paid, same plan = cycle, coupon renewal: discounted now, full price after', () => {
            // 30% off for one term: Amount discounted, RenewAmount the full price it reverts to.
            upcomingYearlySub.Amount = 8392;
            upcomingYearlySub.Discount = 3596;
            upcomingYearlySub.RenewAmount = 11988;
            yearlySub.UpcomingSubscription = upcomingYearlySub;
            const { getAllByTestId, getByTestId } = render(yearlySub);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 83.92, for 12 months');
            expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 119.88, for 12 months');
        });

        it('Row 8 — paid → paid, fewer seats: two rows of the same plan, Active then Upcoming', () => {
            const downgrading: Subscription = {
                ...withMembers(3, 'sub-current'),
                UpcomingSubscription: withMembers(1, 'sub-upcoming'),
            };
            const { getAllByTestId } = render(downgrading);
            expect(getAllByTestId('planNameId').map((el) => el.textContent)).toEqual([
                'Workspace Standard',
                'Workspace Standard',
            ]);
            expect(getAllByTestId('subscriptionStatusId').map((el) => el.textContent)).toEqual(['Active', 'Upcoming']);
        });

        it('Row 9 — paid → paid, fewer seats, coupon: upcoming row shows the discounted price it will be billed', () => {
            const downgrading: Subscription = {
                ...withMembers(3, 'sub-current'),
                UpcomingSubscription: {
                    ...withMembers(1, 'sub-upcoming'),
                    Amount: 699,
                    RenewAmount: 699,
                    BaseRenewAmount: 4788,
                },
            };
            const { getAllByTestId } = render(downgrading);
            // A standalone upcoming row shows the discounted RenewAmount the customer will actually be charged.
            expect(getAllByTestId('renewalNotice')[1]).toHaveTextContent(
                'Renews automatically at CHF 6.99, for 12 months'
            );
            expect(getAllByTestId('planPriceId')[1]).toHaveTextContent('CHF 6.99');
        });

        it('Row 10 — coupon 100% (one-time): term is free, renews at full price next term', () => {
            // Only the current term is free; the next term reverts to the full BaseRenewAmount. The Discount is what
            // marks the 0 as a genuine free term rather than an unpriced one.
            subscription.Amount = 0;
            subscription.Discount = 1299;
            subscription.RenewAmount = 1299;
            subscription.BaseRenewAmount = 1299;
            const { getByTestId } = render(subscription);
            expect(getByTestId('planPriceId')).toHaveTextContent('CHF 0');
            expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 12.99, for 1 month');
        });

        it('Row 11 — coupon 100% (forever): renewal shows "Free renewal"', () => {
            // A forever 100% coupon keeps RenewAmount at 0 but BaseRenewAmount at the full plan price.
            subscription.Amount = 0;
            subscription.Discount = 1299;
            subscription.RenewAmount = 0;
            subscription.BaseRenewAmount = 1299;
            const { getByTestId } = render(subscription);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Free renewal');
            expect(getByTestId('planPriceId')).toHaveTextContent('CHF 0');
        });

        it('Row 12 — coupon partial (forever): renewal shows the discounted recurring price', () => {
            // A forever 30% coupon: the user keeps paying the discounted RenewAmount each term.
            subscription.Amount = 909;
            subscription.RenewAmount = 909;
            subscription.BaseRenewAmount = 1299;
            const { getByTestId } = render(subscription);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically at CHF 9.09, for 1 month');
        });

        it('Row 13 — LIFETIME coupon: end date is "Never" and renewal text mentions transfer', () => {
            subscription.CouponCode = COUPON_CODES.LIFETIME;
            const { getByTestId, getByText } = render(subscription);
            expect(getByText('Never')).toBeInTheDocument();
            expect(getByTestId('renewalNotice')).toHaveTextContent('Lifetime accounts can be transferred or sold');
        });

        it('Row 14 — paid → free (cancellation): Expiring badge, no renewal notice', () => {
            subscription.Renew = Renew.Disabled;
            const { getByTestId, container } = render(subscription);
            expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Expiring');
            expect(container).not.toHaveTextContent('Renews automatically');
        });

        it('Row 15 — renew disabled with an upcoming: upcoming row is suppressed', () => {
            subscription.Renew = Renew.Disabled;
            subscription.UpcomingSubscription = upcoming;
            const { getAllByTestId, container } = render(subscription);
            expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
            expect(container).not.toHaveTextContent('Upcoming');
        });

        it('Row 16 — B2B trial: shows the "Free Trial" badge and is billed at renewal, not prepaid', () => {
            subscription.IsTrial = true;
            const { getByTestId } = render(subscription, { IsBusiness: true } as any);
            expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Free Trial');
            expect(getByTestId('billingTypeId')).toHaveTextContent('Billed at renewal');
        });

        it('Row 16b — active term is always invoiced: prepaid even though the API reports IsPrepaid false', () => {
            subscription.IsPrepaid = false;
            const { getByTestId } = render(subscription);
            expect(getByTestId('billingTypeId')).toHaveTextContent('Prepaid');
        });

        it('Row 17 — B2C / referral trial: shows the "Free Trial" badge', () => {
            subscription.IsTrial = true;
            subscription.TrialType = TrialType.ReferralProgram;
            const { getByTestId } = render(subscription);
            expect(getByTestId('subscriptionStatusId')).toHaveTextContent('Free Trial');
        });

        it('Row 18 — trial → paid same-plan (already paid): folds to one prepaid-upgrade row', () => {
            subscription.IsTrial = true;
            subscription.UpcomingSubscription = upcoming;
            const { getAllByTestId, getByTestId } = render(subscription);
            expect(getAllByTestId('subscriptionStatusId')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 12 months');
        });

        it('Row 19 — trial → paid same-plan (unpaid upcoming): folds to one auto-variable-cycle row', () => {
            subscription.IsTrial = true;
            subscription.UpcomingSubscription = {
                ...upcoming,
                IsPrepaid: false,
                Amount: 0,
                RenewAmount: 0,
                BaseRenewAmount: 11988,
            };
            const { getAllByTestId, getByTestId, queryByTestId } = render(subscription);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent(
                'Renews automatically at CHF 119.88, for 12 months, on'
            );
            expect(queryByTestId('renewalNoticeSecondary')).not.toBeInTheDocument();
        });

        it('Row 20 — trial → paid same-plan (coupon, prepaid): folds to one prepaid-upgrade row', () => {
            subscription.IsTrial = true;
            subscription.UpcomingSubscription = {
                ...upcoming,
                Amount: 8391,
                RenewAmount: 8391,
                BaseRenewAmount: 11988,
            };
            const { getAllByTestId, getByTestId } = render(subscription);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 12 months');
        });

        it('Row 21 — variable-cycle transitional (24m → 12m), no upcoming yet: renewal text is hidden', () => {
            const transitional: Subscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS }),
                    'sub-current'
                ),
                RenewCycle: CYCLE.YEARLY,
            };
            const { queryByTestId } = render(transitional);
            expect(queryByTestId('renewalNotice')).not.toBeInTheDocument();
        });

        it('Row 22 — 1m → 24m prepaid upgrade (same plan): folds to one prepaid-upgrade row', () => {
            subscription.UpcomingSubscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS }),
                    'sub-upcoming'
                ),
                Amount: 21998,
                RenewAmount: 11988,
                BaseRenewAmount: 11988,
                Cycle: CYCLE.TWO_YEARS,
                RenewCycle: CYCLE.YEARLY,
            };
            const { getAllByTestId, getByTestId } = render(subscription);
            expect(getAllByTestId('renewalNotice')).toHaveLength(1);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Switches to 24 months');
            // Prepaid 24m term, then reverts to the yearly recurring price.
            expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 119.88, for 12 months');
        });

        it.each([[CYCLE.THREE], [CYCLE.SIX], [CYCLE.FIFTEEN], [CYCLE.EIGHTEEN], [CYCLE.THIRTY]])(
            'Row 23 — special cycle %s with an automatic 12m renewal: folds to one auto-variable-cycle row',
            (specialCycle) => {
                const current = withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY }),
                    'sub-current'
                );
                current.Cycle = specialCycle;
                current.RenewCycle = CYCLE.YEARLY;
                current.UpcomingSubscription = {
                    ...withId(
                        buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.YEARLY }),
                        'sub-upcoming'
                    ),
                    IsPrepaid: false,
                    Amount: 11988,
                    RenewAmount: 11988,
                    BaseRenewAmount: 11988,
                    Cycle: CYCLE.YEARLY,
                    RenewCycle: CYCLE.YEARLY,
                };
                const { getAllByTestId, getByTestId } = render(current);
                expect(getAllByTestId('renewalNotice')).toHaveLength(1);
                expect(getByTestId('renewalNotice')).toHaveTextContent(
                    'Renews automatically at CHF 119.88, for 12 months, on'
                );
            }
        );

        it('Row 24 — primary + secondary each with a same-plan upcoming: folds to two rows', () => {
            const secondary: Subscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.MONTHLY }),
                    'sub-secondary'
                ),
                UpcomingSubscription: withId(
                    buildSubscription({ planName: PLANS.PASS, currency: 'CHF', cycle: CYCLE.YEARLY }),
                    'sub-secondary-upcoming'
                ),
            };
            subscription.UpcomingSubscription = upcoming;
            const root: Subscription = { ...subscription, SecondarySubscriptions: [secondary] };
            const { getAllByTestId } = render(root);
            // Both same-plan upcomings fold; primary BUNDLE row + secondary PASS row remain.
            expect(getAllByTestId('subscriptionStatusId').map((el) => el.textContent)).toEqual(['Active', 'Active']);
            expect(getAllByTestId('planNameId').map((el) => el.textContent)).toEqual(['Proton Unlimited', 'Pass Plus']);
        });

        it('Row 25 — free / not-paid secondary subscription: filtered out', () => {
            const root: Subscription = {
                ...subscription,
                SecondarySubscriptions: [FREE_SUBSCRIPTION as unknown as Subscription],
            };
            const { getAllByTestId } = render(root);
            expect(getAllByTestId('planNameId')).toHaveLength(1);
        });

        it('Row 26 — externally managed (Android): renews on the store and offers no reactivate', () => {
            subscription.External = SubscriptionPlatform.Android;
            subscription.Renew = Renew.Disabled;
            const { getByTestId, queryByText } = render(subscription);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Renews automatically on Google Play');
            expect(queryByText('Reactivate')).not.toBeInTheDocument();
        });

        it('Row 27 — 1m → 24m unpaid change reverting to 12m: announces the 24m charge, then the 12m recurring price', () => {
            subscription.UpcomingSubscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS }),
                    'sub-upcoming'
                ),
                IsPrepaid: false,
                Amount: 11976,
                RenewAmount: 8388,
                BaseRenewAmount: 11976,
                Cycle: CYCLE.TWO_YEARS,
                RenewCycle: CYCLE.YEARLY,
            };
            const { getByTestId } = render(subscription);
            expect(getByTestId('renewalNotice')).toHaveTextContent(
                'Renews automatically at CHF 119.76, for 24 months, on'
            );
            expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 83.88, for 12 months');
        });

        it('Row 28 — superseded current term the API never priced: falls back to BaseRenewAmount', () => {
            subscription.Amount = 0;
            subscription.Discount = 0;
            subscription.RenewAmount = 0;
            subscription.BaseRenewAmount = 999;
            subscription.RenewCycle = CYCLE.TWO_YEARS;
            subscription.UpcomingSubscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.TWO_YEARS }),
                    'sub-upcoming'
                ),
                IsPrepaid: false,
                Amount: 11976,
                RenewAmount: 8388,
                BaseRenewAmount: 11976,
                Cycle: CYCLE.TWO_YEARS,
                RenewCycle: CYCLE.YEARLY,
            };
            const { getByTestId } = render(subscription);
            expect(getByTestId('planPriceId')).toHaveTextContent('CHF 9.99');
        });

        it('Row 29 — 100% coupon on a prepaid upcoming term: free next term, then the full price', () => {
            subscription.Amount = 1299;
            subscription.RenewAmount = 0;
            subscription.BaseRenewAmount = 1299;
            subscription.UpcomingSubscription = {
                ...withId(
                    buildSubscription({ planName: PLANS.BUNDLE, currency: 'CHF', cycle: CYCLE.MONTHLY }),
                    'sub-upcoming'
                ),
                IsPrepaid: true,
                Amount: 0,
                Discount: 1299,
                RenewAmount: 1299,
                BaseRenewAmount: 1299,
            };
            const { getByTestId } = render(subscription);
            expect(getByTestId('renewalNotice')).toHaveTextContent('Free renewal');
            expect(getByTestId('renewalNoticeSecondary')).toHaveTextContent('Then CHF 12.99, for 1 month');
        });
    });
});
