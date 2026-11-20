import { useState } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalsProvider from '@proton/components/containers/modals/Provider';
import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';
import { createMockModel, createMockSignupParameters } from '@proton/payments/testing/signup';
import { addApiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import Step1 from './Step1';

vi.mock('./PaymentSummary', () => ({
    __esModule: true,
    default: ({ giftCode }: any) => <div>{giftCode}</div>,
}));

vi.mock('./GiftCodeSummary', () => ({
    __esModule: true,
    default: ({ onApplyCode, onRemoveCode }: any) => (
        <>
            <button onClick={() => onApplyCode('GIFT10')}>apply code</button>
            <button onClick={() => onRemoveCode()}>remove code</button>
        </>
    ),
}));

vi.mock('./CycleSelector', () => ({
    __esModule: true,
    default: ({ onGetTheDeal }: any) => (
        <button onClick={() => onGetTheDeal({ cycle: 12, planIDs: undefined })}>change cycle</button>
    ),
}));

vi.mock('@proton/payments-ui/containers/payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('../single-signup-v2/AccountStepDetails', () => ({
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
    const mapping = (planName: PLANS, cycle: CYCLE) => ({
        planIDs: { [planName]: 1 },
        checkResult: { ...subscriptionData.checkResult, Cycle: cycle },
    });
    const planMapping = (planName: PLANS) =>
        Object.fromEntries(
            Object.values(CYCLE)
                .filter(Number.isInteger)
                .map((cycle) => [cycle, mapping(planName, cycle as CYCLE)])
        );
    return {
        [PLANS.VPN2024]: planMapping(PLANS.VPN2024),
        [PLANS.BUNDLE]: planMapping(PLANS.BUNDLE),
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

const Harness = ({ showThreePlans = false, coupon }: { showThreePlans?: boolean; coupon?: COUPON_CODES }) => {
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
            checkResult: {
                ...createMockModel().subscriptionData.checkResult,
                Coupon: coupon ? { Code: coupon, Description: '', MaximumRedemptionsPerUser: null } : null,
            },
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
                showThreePlans={showThreePlans}
                upsellShortPlan={undefined}
                onComplete={vi.fn()}
                onCurrencyChange={async () => {}}
                model={model}
                setModel={setModel as any}
                upsellImg={<div />}
                measure={vi.fn()}
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
        renderWithProviders(<Harness />, { preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } } });

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
        renderWithProviders(<Harness />, { preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } } });

        await userEvent.click(await screen.findByText('apply code'));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0]).toEqual(expectedPayload({ CouponCode: 'GIFT10', Codes: ['GIFT10'] }));
    });

    it('sends the full check payload without a code when the code is removed', async () => {
        renderWithProviders(<Harness />, { preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } } });

        await userEvent.click(await screen.findByText('remove code'));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0]).toEqual(expectedPayload({}));
    });
});

describe('single-signup Step1 three plans', () => {
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

    it('keeps the regular plan selection outside of the experiment', async () => {
        renderWithProviders(<Harness />, { preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } } });

        expect(await screen.findByText('change cycle')).toBeInTheDocument();
        expect(screen.queryByTestId(`three-plans-card-${PLANS.VPN2024}`)).not.toBeInTheDocument();
    });

    it('shows the Free, VPN Plus and Proton Unlimited cards', async () => {
        renderWithProviders(<Harness showThreePlans />, {
            preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } },
        });

        expect(await screen.findByTestId(`three-plans-card-${PLANS.FREE}`)).toBeInTheDocument();
        expect(screen.getByTestId(`three-plans-card-${PLANS.VPN2024}`)).toBeInTheDocument();
        expect(screen.getByTestId(`three-plans-card-${PLANS.BUNDLE}`)).toBeInTheDocument();
        expect(screen.queryByText('change cycle')).not.toBeInTheDocument();
    });

    it('checks Proton Unlimited without the coupon of VPN Plus', async () => {
        renderWithProviders(<Harness showThreePlans coupon={COUPON_CODES.VPN_INTRO_2025} />, {
            preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } },
        });

        await userEvent.click(await screen.findByTestId(`three-plans-select-${PLANS.BUNDLE}`));

        await waitFor(() => expect(requests).toHaveLength(1));
        expect(requests[0].Plans).toEqual({ [PLANS.BUNDLE]: 1 });
        expect(requests[0].CouponCode).toBeUndefined();
    });

    it('keeps the code entered by the user when changing plan', async () => {
        renderWithProviders(<Harness showThreePlans coupon={COUPON_CODES.VPN_INTRO_2025} />, {
            preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } },
        });

        await userEvent.click(await screen.findByText('apply code'));
        await waitFor(() => expect(requests).toHaveLength(1));

        await userEvent.click(screen.getByTestId(`three-plans-select-${PLANS.BUNDLE}`));

        await waitFor(() => expect(requests).toHaveLength(2));
        expect(requests[1].Plans).toEqual({ [PLANS.BUNDLE]: 1 });
        expect(requests[1].CouponCode).toBe('GIFT10');
    });
});
