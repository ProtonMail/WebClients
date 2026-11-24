import type { ReactElement } from 'react';

import { screen } from '@testing-library/react';

import ModalsProvider from '@proton/components/containers/modals/Provider';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';
import { createMockModel } from '@proton/payments/testing/signup';

import BusinessReferralCheckoutForm from './businessReferral/components/checkout/CheckoutForm';
import DrivePaymentStep from './drive/steps/PaymentStep';
import MeetB2CPlanPaymentStep from './meetB2CPlan/steps/PaymentStep';
import ReferralPaymentStep from './referral/steps/PaymentStep';

vi.mock('@proton/payments-ui/containers/payments/PaymentWrapper', () => ({
    __esModule: true,
    default: () => null,
}));
vi.mock('./drive/components/PricingCard/PricingCard', () => ({ PricingCard: () => null }));
vi.mock('./meetB2CPlan/components/PricingCard/PricingCard', () => ({ PricingCard: () => null }));
vi.mock('./referral/components/PricingCard/PricingCard', () => ({ PricingCard: () => null }));
vi.mock('./businessReferral/components/checkout/PricingCard/PricingCard', () => ({ PricingCard: () => null }));
vi.mock('./businessReferral/components/checkout/AccountDetailsForm', () => ({
    __esModule: true,
    default: () => null,
}));

const options = { ...createMockModel().subscriptionData, planIDs: { [PLANS.DRIVE]: 1 }, cycle: CYCLE.YEARLY };

// The payments load failed, so the prices never loaded
const payments = {
    initializationStatus: {
        triggered: true,
        pricingInitialized: false,
        error: new Error('Plans failed'),
    },
    options,
    plansMap: PLANS_MAP,
    selectedPlan: new SelectedPlan(options.planIDs, PLANS_MAP, options.cycle, options.currency),
    checkResult: options.checkResult,
    checkoutUi: getCheckoutUi({ planIDs: options.planIDs, plansMap: PLANS_MAP, checkResult: options.checkResult }),
    loadingPaymentDetails: true,
    paymentStatus: undefined,
    availableCurrencies: ['CHF'],
    telemetryContext: 'other',
    selectFullBillingAddress: vi.fn(),
    setVatNumber: vi.fn(),
};

vi.mock('@proton/payments-ui/ui/context/PaymentContextOptimistic', () => ({
    usePaymentOptimistic: () => payments,
}));

vi.mock('../context/SignupContext', () => ({
    useSignup: () => ({ app: 'generic', loading: { init: false } }),
}));

describe('signup payment steps', () => {
    it.each<[string, ReactElement]>([
        ['Drive', <DrivePaymentStep onPaymentTokenProcessed={vi.fn()} onBack={vi.fn()} />],
        ['Meet B2C plan', <MeetB2CPlanPaymentStep onPaymentTokenProcessed={vi.fn()} onBack={vi.fn()} />],
        ['Referral', <ReferralPaymentStep onPaymentTokenProcessed={vi.fn()} onBack={vi.fn()} />],
        ['Business referral', <BusinessReferralCheckoutForm onPaymentTokenProcessed={vi.fn()} />],
    ])('%s shows the load error page instead of a payment that cannot go through', (_, step) => {
        renderWithProviders(<ModalsProvider>{step}</ModalsProvider>, {
            preloadedState: { staticExperiments: { PaypalFirst: 'disabled' } },
        });

        expect(screen.getByText('Error: Plans failed')).toBeInTheDocument();
    });
});
