import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import PaymentStep from './PaymentStep';

vi.mock('@proton/account/referralInfo/hooks', () => ({
    useReferralInfo: () => [{ uiData: { refereeRewardAmount: '$20' } }],
}));
vi.mock('@proton/payments-ui/client-extensions/usePaymentFacade', () => ({
    usePaymentFacade: ({
        onChargeable,
    }: {
        onChargeable: (operations: unknown, data: unknown) => Promise<unknown>;
    }) => ({
        selectedProcessor: {
            // Like the card processor: hands the token over without waiting for the signup
            processPaymentToken: async () => {
                void onChargeable(undefined, {});
            },
            meta: { type: 'chargebee-card' },
        },
    }),
}));
vi.mock('@proton/payments-ui/containers/payments/PaymentWrapper', () => ({ default: () => null }));
vi.mock('@proton/payments-ui/ui/billing-address/hooks/useBillingAddress', () => ({
    useBillingAddress: () => ({ taxCountry: {} }),
}));
vi.mock('@proton/payments-ui/ui/components/PayButton', () => ({
    PayButton: ({ children }: { children: React.ReactNode }) => <button type="submit">{children}</button>,
}));
vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => ({
        options: { currency: 'USD', planIDs: {} },
        selectedPlan: { name: 'bundle2022', getPlanName: () => 'bundle2022' },
        initializationStatus: { pricingInitialized: true },
        loadingPaymentDetails: false,
        checkResult: { AmountDue: 0 },
        plansMap: {},
    }),
}));
vi.mock('../../../../signup/usePaypalFirstSort', () => ({ usePaypalFirstSort: () => undefined }));
vi.mock('../../../context/SignupContext', () => ({
    useSignup: () => ({ submitPaymentData: vi.fn(), app: 'generic', loading: {} }),
}));
vi.mock('../helpers/useIsVPNPlanWithoutTrialVariant', () => ({ useIsVPNPlanWithoutTrialVariant: () => false }));
vi.mock('../helpers/useShouldStartTrial', () => ({ useShouldStartTrial: () => true }));
vi.mock('../components/Layout/Aside', () => ({ Aside: () => null }));
vi.mock('../components/Layout/Footer', () => ({ Footer: () => null }));
vi.mock('../components/Layout/Header', () => ({ default: () => null }));
vi.mock('../components/Layout/Layout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/Layout/Main', () => ({
    Main: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/Layout/Wrapper', () => ({
    Wrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../components/PricingCard/PricingCard', () => ({ PricingCard: () => null }));

describe('PaymentStep', () => {
    it('ignores a second Pay tap while the signup started by the first is still running', async () => {
        let finishSignup = () => {};
        const onPaymentTokenProcessed = vi.fn(() => new Promise<void>((resolve) => (finishSignup = resolve)));

        render(<PaymentStep onPaymentTokenProcessed={onPaymentTokenProcessed} onBack={vi.fn()} />);
        const pay = screen.getByRole('button', { name: 'Start free trial' });

        fireEvent.click(pay);
        await waitFor(() => expect(onPaymentTokenProcessed).toHaveBeenCalledTimes(1));
        // Lets processPaymentToken settle, as it does long before the signup finishes
        await act(async () => {});

        fireEvent.click(pay);
        await act(async () => {});
        expect(onPaymentTokenProcessed).toHaveBeenCalledTimes(1);

        await act(async () => finishSignup());
        fireEvent.click(pay);
        await waitFor(() => expect(onPaymentTokenProcessed).toHaveBeenCalledTimes(2));
    });
});
