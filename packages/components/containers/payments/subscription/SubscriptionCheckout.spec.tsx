import { render } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import SubscriptionCheckout from './SubscriptionCheckout';

jest.mock('../../../hooks', () => ({
    useConfig: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

jest.mock('../Checkout', () => ({ children }: any) => <>{children}</>);

describe('SubscriptionCheckout', () => {
    let checkResult: SubscriptionCheckResponse;

    beforeEach(() => {
        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            Additions: null,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
        };
    });

    it('should display Proration if it is available and showProration is true', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free_vpn: 0, [PLANS.VPN]: 0 }}
                isOptimistic={true}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                showProration={true}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should display Proration if it is available and showProration is undefined', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free_vpn: 0, [PLANS.VPN]: 0 }}
                isOptimistic={true}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should not display proration if showProration is false', () => {
        checkResult.Proration = -451;

        let { container } = render(
            <SubscriptionCheckout
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free_vpn: 0, [PLANS.VPN]: 0 }}
                isOptimistic={true}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                showProration={false}
            ></SubscriptionCheckout>
        );

        expect(container).not.toHaveTextContent('Proration');
        expect(container).not.toHaveTextContent('-CHF 4.51');
    });

    it('should display next start date if proration must be hidden', () => {
        checkResult.Proration = 0;

        let { container } = render(
            <SubscriptionCheckout
                checkResult={checkResult}
                plansMap={{}}
                vpnServers={{ free_vpn: 0, [PLANS.VPN]: 0 }}
                isOptimistic={true}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                onChangeCurrency={() => {}}
                showProration={false}
                nextSubscriptionStart={1668868986}
            ></SubscriptionCheckout>
        );

        expect(container).toHaveTextContent('Start date');
    });
});
