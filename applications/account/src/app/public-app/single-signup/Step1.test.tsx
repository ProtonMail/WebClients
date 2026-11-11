import { useState } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalsProvider from '@proton/components/containers/modals/Provider';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';
import { createMockModel, createMockSignupParameters } from '@proton/payments/testing/signup';
import { addApiMock, clearApiMocks } from '@proton/test-api/api';

import Step1 from './Step1';

jest.mock('./PaymentSummary', () => ({
    __esModule: true,
    default: ({ giftCode }: any) => <div>{giftCode}</div>,
}));

jest.mock('./GiftCodeSummary', () => ({
    __esModule: true,
    default: ({ onApplyCode, onRemoveCode }: any) => (
        <>
            <button onClick={() => onApplyCode('GIFT10')}>apply code</button>
            <button onClick={() => onRemoveCode()}>remove code</button>
        </>
    ),
}));

jest.mock('./CycleSelector', () => ({
    __esModule: true,
    default: ({ onGetTheDeal }: any) => (
        <button onClick={() => onGetTheDeal({ cycle: 12, planIDs: undefined })}>change cycle</button>
    ),
}));

jest.mock('@proton/payments-ui/containers/payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../single-signup-v2/AccountStepDetails', () => ({
    __esModule: true,
    default: () => null,
}));

const CHECK_URL = 'payments/v5/subscription/check';

const checkResponse = (query: any) => ({
    Amount: 1234,
    AmountDue: 1234,
    Proration: 0,
    CouponDiscount: 0,
    Gift: 0,
    Credit: 0,
    Coupon: query.data.CouponCode
        ? { Code: query.data.CouponCode, Description: '', MaximumRedemptionsPerUser: null }
        : null,
    Cycle: query.data.Cycle,
    Currency: query.data.Currency,
    TaxMode: 'TaxIncluded',
    Taxes: [],
    SubscriptionMode: 0,
    BaseRenewAmount: null,
    RenewCycle: null,
    PeriodEnd: 0,
});

const getCycleMapping = () => {
    const { subscriptionData } = createMockModel();
    const mapping = (cycle: CYCLE) => ({
        planIDs: { [PLANS.VPN2024]: 1 },
        checkResult: { ...subscriptionData.checkResult, Cycle: cycle },
    });
    return {
        [PLANS.VPN2024]: Object.fromEntries(
            Object.values(CYCLE)
                .filter(Number.isInteger)
                .map((cycle) => [cycle, mapping(cycle as CYCLE)])
        ),
    };
};

const expectedPayload = (overrides: Record<string, unknown>) => ({
    Plans: { [PLANS.VPN2024]: 1 },
    Currency: 'CHF',
    Cycle: CYCLE.MONTHLY,
    ValidateBillingAddress: true,
    VatId: 'VAT-123',
    BillingAddress: { CountryCode: 'CH', State: '', VatId: 'VAT-123' },
    Codes: [],
    ...overrides,
});

const Harness = () => {
    const [model, setModel] = useState(() => ({
        ...createMockModel(),
        subscriptionDataCycleMapping: getCycleMapping(),
        cycleData: { cycles: [CYCLE.MONTHLY, CYCLE.YEARLY], upsellCycle: CYCLE.YEARLY },
        signupType: 'default',
        mode: 'pricing',
        subscriptionData: {
            ...createMockModel().subscriptionData,
            planIDs: { [PLANS.VPN2024]: 1 },
            vatNumber: 'VAT-123',
        },
    }));

    return (
        <ModalsProvider>
            <Step1
                activeBreakpoint={{ viewportWidth: { '>=large': true } } as any}
                mode="pricing"
                selectedPlan={PLANS_MAP[PLANS.VPN2024] as any}
                cycleData={model.cycleData}
                isB2bPlan={false}
                upsellShortPlan={undefined}
                onComplete={jest.fn()}
                onCurrencyChange={async () => {}}
                model={model}
                setModel={setModel as any}
                upsellImg={<div />}
                measure={jest.fn()}
                toAppName="Proton VPN"
                toApp={'proton-vpn' as any}
                telemetryContext={{} as any}
                signupParameters={createMockSignupParameters()}
            />
        </ModalsProvider>
    );
};

describe('single-signup Step1 subscription check payload', () => {
    const requests: any[] = [];

    beforeEach(() => {
        requests.length = 0;
        addApiMock(
            CHECK_URL,
            (query: any) => {
                requests.push(query.data);
                return checkResponse(query);
            },
            'post'
        );
    });

    afterEach(() => {
        clearApiMocks();
    });

    /**
     * Regression for P2-2735: the getSubscriptionPrices arguments are going to be built in one place. Pins the
     * full check payload Step1 sends when the cycle changes, a code is applied and a code is removed.
     */
    it('sends the full check payload when the cycle changes', async () => {
        renderWithProviders(<Harness />, { preloadedState: {} });

        await userEvent.click(await screen.findByText('change cycle'));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0]).toEqual(
            expectedPayload({
                Cycle: CYCLE.YEARLY,
                CouponCode: COUPON_CODES.VPN_INTRO_2025,
                Codes: [COUPON_CODES.VPN_INTRO_2025],
            })
        );
    });

    it('sends the full check payload with the code when a code is applied', async () => {
        renderWithProviders(<Harness />, { preloadedState: {} });

        await userEvent.click(await screen.findByText('apply code'));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0]).toEqual(expectedPayload({ CouponCode: 'GIFT10', Codes: ['GIFT10'] }));
    });

    it('sends the full check payload without a code when the code is removed', async () => {
        renderWithProviders(<Harness />, { preloadedState: {} });

        await userEvent.click(await screen.findByText('remove code'));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0]).toEqual(expectedPayload({}));
    });
});
