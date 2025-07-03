import { renderHook } from '@testing-library/react-hooks';

import { type Plan } from '@proton/payments';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments';
import { SelectedPlan } from '@proton/payments';
import { hookWrapper } from '@proton/testing';
import { buildSubscription } from '@proton/testing/builders';
import { getTestPlans } from '@proton/testing/data';
import { withApi, withConfig, withReduxStore } from '@proton/testing/lib/context/providers';

import { useSubscriptionPriceComparison } from './helper';

const getWrapper = (plans?: Plan[]) =>
    hookWrapper(
        withApi(),
        withConfig(),
        withReduxStore({
            plans,
        })
    );

describe('useSubscriptionPriceComparison', () => {
    it('should render', () => {
        const { result } = renderHook(() => useSubscriptionPriceComparison(), {
            wrapper: getWrapper(),
        });
        expect(result.current).toBeDefined();
    });

    it('should return default values when no subscription is provided', () => {
        const { result } = renderHook(() => useSubscriptionPriceComparison(), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 0,
            cheapestMonthlyPrice: 0,
            priceFallbackPerMonth: 0,
            totalSavings: 0,
            showPriceDifference: false,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should return default values when provided a free subscription', () => {
        const { result } = renderHook(() => useSubscriptionPriceComparison(FREE_SUBSCRIPTION), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 0,
            cheapestMonthlyPrice: 0,
            priceFallbackPerMonth: 0,
            totalSavings: 0,
            showPriceDifference: false,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should return default values when plans map is loading', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription), {
            wrapper: getWrapper(),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 0,
            cheapestMonthlyPrice: 0,
            priceFallbackPerMonth: 0,
            totalSavings: 0,
            showPriceDifference: false,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should calculate price difference when subscription and compareWithPlan are provided', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription, PLANS.BUNDLE), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 800,
            priceDifferenceCheapestCycle: 0,
            priceFallbackPerMonth: 799,
            cheapestMonthlyPrice: 799,
            totalSavings: 0,
            showPriceDifference: true,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should calculate cheapest cycle pricing and potential savings', () => {
        // Create a subscription with a higher monthly price than standard pricing
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            ),
            {
                Amount: 1099, // Higher than standard pricing to show savings
            }
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription), {
            wrapper: getWrapper(getTestPlans()),
        });

        // We expect to show savings because yearly/biyearly cycle is typically cheaper per month
        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 750,
            priceFallbackPerMonth: 349,
            cheapestMonthlyPrice: 349,
            totalSavings: 18000,
            showPriceDifference: false,
            showPriceDifferenceCheapest: true,
            showSavings: true,
        });
    });

    it('should use upcoming subscription if available', () => {
        const upcomingSubscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.YEARLY,
                'USD'
            )
        );

        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.TWO_YEARS,
                'USD'
            ),
            {
                UpcomingSubscription: upcomingSubscription,
            }
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription, PLANS.VPN2024), {
            wrapper: getWrapper(getTestPlans()),
        });

        // The hook should use the upcoming subscription (MAIL two years)
        // rather than the current subscription (MAIL yearly)
        expect(result.current).toEqual({
            priceDifference: 150,
            priceDifferenceCheapestCycle: 0,
            priceFallbackPerMonth: 499,
            cheapestMonthlyPrice: 499,
            totalSavings: 0,
            showPriceDifference: true,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should handle when compareWithPlan is not provided', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription), {
            wrapper: getWrapper(getTestPlans()),
        });

        // In this case, the hook should use the current plan name (MAIL) as the compare plan
        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 150,
            priceFallbackPerMonth: 349,
            cheapestMonthlyPrice: 349,
            totalSavings: 3600,
            showPriceDifference: false,
            showPriceDifferenceCheapest: true,
            showSavings: true,
        });
    });

    it('should return default values when compareWithPlan is not found in plansMap', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            )
        );

        // Pass a non-existent plan name
        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription, 'NON_EXISTENT_PLAN' as any), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 0,
            cheapestMonthlyPrice: 0,
            priceFallbackPerMonth: 0,
            totalSavings: 0,
            showPriceDifference: false,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should handle different currency subscriptions', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('EUR'),
                CYCLE.MONTHLY,
                'EUR'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription), {
            wrapper: getWrapper(getTestPlans('EUR')),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 150,
            priceFallbackPerMonth: 349,
            cheapestMonthlyPrice: 349,
            totalSavings: 3600,
            showPriceDifference: false,
            showPriceDifferenceCheapest: true,
            showSavings: true,
        });
    });

    it('should handle different cycle lengths', () => {
        const yearlySubscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.YEARLY,
                'USD'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(yearlySubscription), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 50,
            priceFallbackPerMonth: 349,
            cheapestMonthlyPrice: 349,
            totalSavings: 1200,
            showPriceDifference: false,
            showPriceDifferenceCheapest: true,
            showSavings: true,
        });
    });

    it('should handle when no pricing options match available cycles', () => {
        // Mock a subscription with a cycle that might not have pricing options in plansMap
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.VPN2024]: 1,
                },
                getTestPlans('USD'),
                CYCLE.THIRTY, // Using a less common cycle
                'USD'
            )
        );

        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription), {
            wrapper: getWrapper(getTestPlans()),
        });

        // The hook should still return a valid result, potentially the default values
        expect(result.current).toEqual({
            priceDifference: 0,
            priceDifferenceCheapestCycle: 0,
            priceFallbackPerMonth: Infinity,
            cheapestMonthlyPrice: Infinity,
            totalSavings: 0,
            showPriceDifference: false,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });

    it('should compare between different plan types', () => {
        const subscription = buildSubscription(
            new SelectedPlan(
                {
                    [PLANS.MAIL]: 1,
                },
                getTestPlans('USD'),
                CYCLE.MONTHLY,
                'USD'
            )
        );

        // Compare with a different plan type (VPN)
        const { result } = renderHook(() => useSubscriptionPriceComparison(subscription, PLANS.VPN2024), {
            wrapper: getWrapper(getTestPlans()),
        });

        expect(result.current).toEqual({
            priceDifference: 500,
            priceDifferenceCheapestCycle: 0,
            priceFallbackPerMonth: 499,
            cheapestMonthlyPrice: 499,
            totalSavings: 0,
            showPriceDifference: true,
            showPriceDifferenceCheapest: false,
            showSavings: false,
        });
    });
});
