import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalsProvider from '@proton/components/containers/modals/Provider';
import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';
import { getCheckoutUi, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { getOptimisticPaymentStatus } from '@proton/payments/core/payment-status';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';
import { createMockModel, createMockSignupParameters } from '@proton/payments/testing/signup';

import { Steps } from '../../../single-signup-v2/interface';
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

const mockAccountStepDetails = vi.fn((_: { defaultEmail?: string }) => null);
vi.mock('../../../single-signup-v2/AccountStepDetails', () => ({
    __esModule: true,
    default: (props: { defaultEmail?: string }) => mockAccountStepDetails(props),
}));

const plansMap = PLANS_MAP as any;
const { subscriptionData } = createMockModel();
const options = {
    ...subscriptionData,
    planIDs: { [PLANS.VPN2024]: 1 },
    cycle: CYCLE.MONTHLY,
    currency: 'CHF' as const,
    vatNumber: 'VAT-123',
};

const getPrice = (planToCheck: PlanToCheck) => {
    const checkResult = getOptimisticCheckResult({ ...planToCheck, plansMap });
    return { checkResult, checkoutUi: getCheckoutUi({ planIDs: planToCheck.planIDs, plansMap, checkResult }) };
};

const payments = {
    initializationStatus: { triggered: true, pricingInitialized: true },
    options,
    plansMap,
    paymentStatus: undefined,
    optimisticPaymentStatus: getOptimisticPaymentStatus({ Bitcoin: true }),
    loadingPaymentDetails: false,
    checkResult: options.checkResult,
    checkoutUi: getPrice(options).checkoutUi,
    billingAddress: options.billingAddress,
    paymentsApi: {},
    getPrice: () => null,
    getPriceOrFallback: getPrice,
    checkMultiplePlans: vi.fn(async () => []),
    getAvailableCurrencies: () => ['CHF'],
    selectPlan: vi.fn(),
    selectNewPlan: vi.fn(async (planToCheck: PlanToCheck) => ({
        ...options.checkResult,
        Coupon: planToCheck.coupon ? { Code: planToCheck.coupon, Description: '' } : null,
    })),
    selectFullBillingAddress: vi.fn(),
    setVatNumber: vi.fn(),
};

vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => payments,
}));

interface HarnessProps {
    email?: string;
    reservedUser?: boolean;
    showThreePlans?: boolean;
}

const Harness = ({ email, reservedUser, showThreePlans = false }: HarnessProps) => (
    <ModalsProvider>
        <Step1
            activeBreakpoint={{ viewportWidth: { '>=large': true } } as any}
            mode="pricing"
            options={options as any}
            selectedPlan={PLANS_MAP[PLANS.VPN2024] as any}
            linkPlanIDs={{ [PLANS.VPN2024]: 1 }}
            cycleData={{ cycles: [CYCLE.MONTHLY, CYCLE.YEARLY], upsellCycle: CYCLE.YEARLY }}
            isB2bPlan={false}
            showThreePlans={showThreePlans}
            upsellShortPlan={undefined}
            onComplete={vi.fn()}
            model={{ step: Steps.Account, subscriptionData: undefined, reservedUser }}
            sessionUID={undefined}
            upsellImg={<div />}
            measure={vi.fn()}
            toAppName="Proton VPN"
            telemetryContext={{} as any}
            signupParameters={{ ...createMockSignupParameters(), email }}
        />
    </ModalsProvider>
);

const render = (props: HarnessProps = {}) =>
    renderWithProviders(<Harness {...props} />, {
        preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } },
    });

describe('VPN Step1 email from the URL', () => {
    beforeEach(() => mockAccountStepDetails.mockClear());

    it('lets the form submit the email from the URL by itself', () => {
        render({ email: 'user@example.com' });
        expect(mockAccountStepDetails).toHaveBeenLastCalledWith(
            expect.objectContaining({ defaultEmail: 'user@example.com' })
        );
    });

    it('leaves a retry to the user once the account is created, so a failing setup cannot loop', () => {
        render({ email: 'user@example.com', reservedUser: true });
        expect(mockAccountStepDetails).toHaveBeenLastCalledWith(expect.objectContaining({ defaultEmail: undefined }));
    });
});

describe('VPN Step1 selection', () => {
    beforeEach(() => {
        payments.selectPlan.mockClear();
        payments.selectNewPlan.mockClear();
    });

    it('selects a new cycle with its automatic coupon', async () => {
        render();

        await userEvent.click(await screen.findByText('change cycle'));

        expect(payments.selectPlan).toHaveBeenCalledWith(
            expect.objectContaining({
                planIDs: { [PLANS.VPN2024]: 1 },
                cycle: CYCLE.YEARLY,
                currency: 'CHF',
                coupon: COUPON_CODES.VPN_INTRO_2025,
            })
        );
    });

    it('checks the selection with an applied code, and keeps the code for the next selection', async () => {
        render();

        await userEvent.click(await screen.findByText('apply code'));
        await waitFor(() =>
            expect(payments.selectNewPlan).toHaveBeenCalledWith(
                expect.objectContaining({ planIDs: { [PLANS.VPN2024]: 1 }, cycle: CYCLE.MONTHLY, coupon: 'GIFT10' })
            )
        );

        await userEvent.click(await screen.findByText('change cycle'));
        expect(payments.selectPlan).toHaveBeenCalledWith(
            expect.objectContaining({ cycle: CYCLE.YEARLY, coupon: 'GIFT10' })
        );
    });

    it('checks the selection without a code when the code is removed', async () => {
        render();

        await userEvent.click(await screen.findByText('remove code'));

        await waitFor(() =>
            expect(payments.selectNewPlan).toHaveBeenCalledWith(expect.objectContaining({ coupon: undefined }))
        );
    });
});

describe('VPN Step1 three plans', () => {
    beforeEach(() => {
        payments.selectPlan.mockClear();
        payments.selectNewPlan.mockClear();
    });

    it('keeps the regular plan selection outside of the experiment', async () => {
        render();

        expect(await screen.findByText('change cycle')).toBeInTheDocument();
        expect(screen.queryByTestId(`three-plans-card-${PLANS.VPN2024}`)).not.toBeInTheDocument();
    });

    it('shows the Free, VPN Plus and Proton Unlimited cards', async () => {
        render({ showThreePlans: true });

        expect(await screen.findByTestId(`three-plans-card-${PLANS.FREE}`)).toBeInTheDocument();
        expect(screen.getByTestId(`three-plans-card-${PLANS.VPN2024}`)).toBeInTheDocument();
        expect(screen.getByTestId(`three-plans-card-${PLANS.BUNDLE}`)).toBeInTheDocument();
        expect(screen.queryByText('change cycle')).not.toBeInTheDocument();
    });

    it('checks Proton Unlimited without the automatic coupon of VPN Plus', async () => {
        render({ showThreePlans: true });

        await userEvent.click(await screen.findByTestId(`three-plans-select-${PLANS.BUNDLE}`));

        expect(payments.selectPlan).toHaveBeenCalledWith(
            expect.objectContaining({ planIDs: { [PLANS.BUNDLE]: 1 }, coupon: undefined })
        );
    });

    it('keeps the code entered by the user when changing plan', async () => {
        render({ showThreePlans: true });

        await userEvent.click(await screen.findByText('apply code'));
        await waitFor(() => expect(payments.selectNewPlan).toHaveBeenCalled());

        await userEvent.click(screen.getByTestId(`three-plans-select-${PLANS.BUNDLE}`));

        expect(payments.selectPlan).toHaveBeenCalledWith(
            expect.objectContaining({ planIDs: { [PLANS.BUNDLE]: 1 }, coupon: 'GIFT10' })
        );
    });
});
