import { screen } from '@testing-library/react';

import ModalsProvider from '@proton/components/containers/modals/Provider';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { createMockModel, createMockSignupParameters } from '@proton/payments/testing/signup';
import { apiMock } from '@proton/test-api/api';

import AccountStepPayment from './AccountStepPayment';

const renderAccountStepPayment = (variant: 'with' | 'without' | 'disabled') => {
    const model = createMockModel();
    model.paymentStatus = {
        CountryCode: 'DE',
        State: null,
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: false,
            Cash: false,
            Bitcoin: false,
            Google: false,
            Ideal: false,
        },
    };

    return renderWithProviders(
        <ModalsProvider>
            <AccountStepPayment
                cta="Pay"
                accountStepPaymentRef={{ current: undefined }}
                api={apiMock}
                model={model}
                options={model.subscriptionData}
                selectedPlan={model.plans[0]}
                loadingPaymentDetails={false}
                loadingSignup={false}
                onPay={jest.fn()}
                onValidate={jest.fn()}
                isFormValid
                withLoadingSignup={jest.fn()}
                measure={jest.fn()}
                defaultMethod={undefined}
                handleOptimistic={jest.fn()}
                onBillingAddressChange={jest.fn()}
                signupParameters={createMockSignupParameters()}
                showRenewalNotice={false}
                app={undefined}
                paymentsApi={{} as any}
                onVatNumberChange={jest.fn()}
                telemetryContext={{} as any}
                onMethodChanged={jest.fn()}
                couponConfig={undefined}
                renewalNotice={null}
            />
        </ModalsProvider>,
        { preloadedState: { staticExperiments: { PaypalFirst: variant } } }
    );
};

const getMethodRadios = async () => {
    await screen.findByTestId('payment-method-chargebee-paypal');
    return screen.getAllByTestId(/^payment-method-/);
};

describe('AccountStepPayment - PaypalFirst experiment', () => {
    it('lists PayPal first and selects it in the "with" variant', async () => {
        renderAccountStepPayment('with');

        const radios = await getMethodRadios();

        expect(radios.map((radio) => radio.getAttribute('data-testid'))).toEqual([
            'payment-method-chargebee-paypal',
            'payment-method-chargebee-card',
        ]);
        expect(screen.getByTestId('payment-method-chargebee-paypal')).toBeChecked();
        expect(screen.getByTestId('payment-method-chargebee-card')).not.toBeChecked();
    });

    it.each(['without', 'disabled'] as const)(
        'keeps credit card first and selected in the "%s" variant',
        async (variant) => {
            renderAccountStepPayment(variant);

            const radios = await getMethodRadios();

            expect(radios.map((radio) => radio.getAttribute('data-testid'))).toEqual([
                'payment-method-chargebee-card',
                'payment-method-chargebee-paypal',
            ]);
            expect(screen.getByTestId('payment-method-chargebee-card')).toBeChecked();
            expect(screen.getByTestId('payment-method-chargebee-paypal')).not.toBeChecked();
        }
    );
});
