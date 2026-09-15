import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { capturePaymentMessage } from '../../sentry/capture';
import { PLANS } from '../constants';
import type { Cycle, PlanIDs } from '../interface';
import type { SubscribeData } from './createPaymentSubscription';
import { createPaymentSubscription } from './createPaymentSubscription';

jest.mock('../../sentry/capture', () => ({
    capturePaymentMessage: jest.fn(),
}));

jest.mock('../../telemetry/telemetry', () => ({
    checkoutTelemetry: {
        reportPayment: jest.fn(),
    },
}));

describe('createPaymentSubscription', () => {
    const buildData = (Plans: PlanIDs): SubscribeData =>
        ({
            Plans,
            Amount: 9999,
            Currency: 'USD',
            Cycle: 12 as Cycle,
            PaymentToken: 'token',
            v: 5,
            BillingAddress: { CountryCode: 'CH', State: null, ZipCode: '1234' },
        }) as unknown as SubscribeData;

    const subscribeWith = (Plans: PlanIDs) => {
        const api = jest.fn().mockResolvedValue({ Subscription: {} }) as unknown as Api;

        return createPaymentSubscription(api, buildData(Plans), {
            build: 'proton-account' as APP_NAMES,
            telemetryContext: undefined,
            userCurrency: 'USD',
            subscription: undefined,
            product: 'generic',
            paymentMethodType: undefined,
            paymentMethodValue: undefined,
        } as any);
    };

    const wrongPlanNameReports = () =>
        jest.mocked(capturePaymentMessage).mock.calls.filter(([message]) => message === 'Payments: wrong plan name');

    beforeEach(() => {
        jest.mocked(capturePaymentMessage).mockClear();
    });

    it('should report the deprecated VPN plan being sent to the backend', async () => {
        await subscribeWith({ [PLANS.VPN]: 1 });

        const reports = wrongPlanNameReports();
        expect(reports).toHaveLength(1);
        expect(reports[0][1]).toMatchObject({
            level: 'warning',
            extra: {
                planName: PLANS.VPN,
                source: 'subscribe',
                planIDs: { [PLANS.VPN]: 1 },
                cycle: 12,
                currency: 'USD',
            },
        });
    });

    it('should not report supported plans', async () => {
        await subscribeWith({ [PLANS.VPN2024]: 1 });

        expect(wrongPlanNameReports()).toHaveLength(0);
    });
});
