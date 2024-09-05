import { render } from '@testing-library/react';

import { CYCLE } from '@proton/shared/lib/constants';
import type { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { buildSubscription } from '@proton/testing/builders';

import SubscriptionCheckout from './SubscriptionCheckout';

jest.mock('../../../../hooks', () => ({
    useConfig: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

jest.mock('../../Checkout', () => ({ children }: any) => <>{children}</>);
const freePlan = FREE_PLAN;

describe('SubscriptionCheckout', () => {
    let checkResult: SubscriptionCheckResponse;

    beforeEach(() => {
        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
        };
    });

    const dummyServers = { free: { servers: 0, countries: 0 }, paid: { servers: 0, countries: 0 } };

    it('should display Proration if it is available and isProration is true', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={dummyServers}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription()}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should display Proration if it is available and isProration is true', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={dummyServers}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription()}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should not display proration if isProration is false', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={dummyServers}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription()}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).not.toHaveTextContent('Proration');
        expect(container).not.toHaveTextContent('-CHF 4.51');
    });

    it('should display next start date if proration must be hidden', () => {
        checkResult.Proration = 0;

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={dummyServers}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledSubscription={true}
                isAddonDowngrade={false}
                subscription={buildSubscription({
                    PeriodEnd: 1668868986,
                })}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Start date');
        expect(container).not.toHaveTextContent('Proration');
    });

    it('should display positive proration', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 4085,
            Proration: 127583,
            Amount: 199750,
            Cycle: 1,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: -323248,
            Coupon: null,
        };

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription({
                    PeriodEnd: 1668868986,
                })}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('CHF 1275.83');
        expect(container).not.toHaveTextContent('-CHF 1275.83');
    });

    /**
     * An example when credits are negative:
     * - you have 10 credits on the account
     * - you upgrade to a 5$/month plan
     * - you should see credits -5 in the <SubscriptionCheckout>
     */
    it('should display negative credits value', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 0,
            Proration: -19149,
            Amount: 8376,
            Cycle: 24,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: -10773,
            Coupon: null,
        };

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription({
                    PeriodEnd: 1668868986,
                })}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Credit');
        expect(container).toHaveTextContent('-CHF 107.73');
    });

    /**
     * Example when credits are positive:
     * - you have 0 credits
     * - you have a plan that's 10/mo
     * - move to a plan that's 5/mo
     * - you should see credits 5 (these will end up on your account balance)
     */
    it('should display positive credits value', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 0,
            Proration: -19149,
            Amount: 8376,
            Cycle: 24,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: 10773,
            Coupon: null,
        };

        let { container } = render(
            <SubscriptionCheckout
                freePlan={freePlan}
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledSubscription={false}
                isAddonDowngrade={false}
                subscription={buildSubscription({
                    PeriodEnd: 1668868986,
                })}
                paymentNeeded={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Credit');
        expect(container).not.toHaveTextContent('-CHF 107.73');
        expect(container).toHaveTextContent('CHF 107.73');
    });
});
