import { render } from '@testing-library/react';

import { ADDON_NAMES, COUPON_CODES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/shared/lib/constants';
import type { Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import { PLANS_MAP, getSubscriptionMock } from '@proton/testing/data';

import { getAllowedCycles } from '../helpers';
import type { Props } from './SubscriptionCycleSelector';
import SubscriptionCycleSelector from './SubscriptionCycleSelector';

let props: Props;

beforeEach(() => {
    props = {
        onChangeCycle: jest.fn(),
        mode: 'buttons',
        currency: 'CHF',
        cycle: CYCLE.TWO_YEARS,
        minimumCycle: CYCLE.MONTHLY,
        planIDs: {
            [PLANS.MAIL]: 1,
        },
        plansMap: PLANS_MAP,
        additionalCheckResults: [],
    };
});

it('should render', () => {
    const { container } = render(<SubscriptionCycleSelector {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should correctly display price per month', () => {
    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 4.99/month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 3.99/month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 3.49/month');
});

it('should correctly display price per user per month', () => {
    const planIDs = {
        mailpro2022: 1,
        '1member-mailpro2022': 3,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} plansMap={PLANS_MAP} planIDs={planIDs} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 7.99/user per month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 6.99/user per month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 6.49/user per month');
});

it('should correctly display price per user per month when there are non-user addons', () => {
    const planIDs = {
        bundlepro2022: 1,
        '1domain-bundlepro2022': 12,
        '1member-bundlepro2022': 8,
    };

    props = {
        ...props,
        planIDs,
        plansMap: PLANS_MAP,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 12.99/user per month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 10.99/user per month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 9.99/user per month');
});

it('should display the prices correctly for VPN Plus', () => {
    const planIDs = {
        vpn2022: 1,
    };

    props = {
        ...props,
        planIDs,
        plansMap: PLANS_MAP,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 9.99/month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 5.99/month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 4.99/month');
});

describe('getAllowedCycles', () => {
    it('should return all cycles if there is no subscription', () => {
        const subscription = undefined;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {};

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 1, 12 and 24 cycles when user has a 1-month subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 12 and 24 cycles when user has a 12-month subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return only 24 cycle if user has 24 cycle subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return 12 and 24 cycles if user has upcoming 12-cycle', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = getSubscriptionMock();
        upcomingSubscriptionMock.Cycle = CYCLE.YEARLY;
        subscription.UpcomingSubscription = upcomingSubscriptionMock;

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return all cycles if user has referral subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.REFERRAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user was downgraded', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.MEMBER_DOWNGRADE_TRIAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user has trial subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return cycles respecting minimumCycle = 12 if user has trial subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return cycles respecting minimumCycle = 24 if user has trial subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.TWO_YEARS;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });

        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return all cycles if plan is changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should filter the plans if the addons changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        subscription.Plans[0].Name = PLANS.BUNDLE_PRO;
        subscription.Plans.push({
            Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
            Quantity: 1,
        } as Plan);

        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return cycles respecting the minimumCycle = 12 if plan is changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return cycles respecting the minimumCycle = 24 if plan is changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.TWO_YEARS;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return cycles respecting the maximumCycle = 12', () => {
        const subscription = getSubscriptionMock();
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        subscription.Cycle = CYCLE.MONTHLY;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });
        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should allow the current cycle even if it is higher than maximum', () => {
        const subscription = getSubscriptionMock();
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        subscription.Cycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should allow upcoming cycle even if it is higher than maximum', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = getSubscriptionMock();
        upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
        subscription.UpcomingSubscription = upcomingSubscription;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const result = getAllowedCycles({ subscription, minimumCycle, maximumCycle, planIDs, plansMap: PLANS_MAP });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should ignore upcoming cycle check with disableUpcomingCycleCheck', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = getSubscriptionMock();
        upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
        subscription.UpcomingSubscription = upcomingSubscription;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };
        const disableUpcomingCycleCheck = true;
        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            disableUpcomingCycleCheck,
            plansMap: PLANS_MAP,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should not return cycles that are not available for the plan', () => {
        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            minimumCycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.TWO_YEARS,
            planIDs: {
                [PLANS.WALLET]: 1,
            } as any,
            // this test assumes that wallet2024 does not have 24 cycle in PLANS_MAP
            plansMap: PLANS_MAP,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    describe('defaultCycles', () => {
        it('should sort defaultCycles to TWO_YEARS, YEARLY, MONTHLY', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort default cycles in descending order', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort defaultCycles to THIRTY, FIFTEEN, MONTHLY', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.THIRTY;
            const defaultCycles = [CYCLE.THIRTY, CYCLE.MONTHLY, CYCLE.FIFTEEN];
            const planIDs: PlanIDs = {
                [PLANS.VPN]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
            });

            expect(result).toEqual([CYCLE.THIRTY, CYCLE.FIFTEEN, CYCLE.MONTHLY]);
        });
    });
});
