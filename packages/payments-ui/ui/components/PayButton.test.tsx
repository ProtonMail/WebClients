import type { ReactNode } from 'react';

import { fireEvent, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useConfig } from '@proton/app-context/useConfig';
import { renderWithProviders } from '@proton/payments-hooks/testing/vitest/renderWithProviders';
import { BILLING_ADDRESS_VALID } from '@proton/payments/core/billing-address/billing-address';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';

import { getIdealAuthorizationText } from '../../payment-methods/ideal/IdealAuthorizationText';
import { useEditBillingAddressModal } from '../billing-address/containers/useEditBillingAddressModal';
import type { TaxCountryHook } from '../billing-address/hooks/useTaxCountry';
import type { VatNumberHook } from '../billing-address/hooks/useVatNumber';
import { ApplePayButton } from './ApplePayButton';
import { ChargebeeIdealButton } from './ChargebeeIdealButton';
import { ChargebeePaypalButton } from './ChargebeePaypalButton';
import { GooglePayButton } from './GooglePayButton';
import { PayButton } from './PayButton';

vi.mock('@proton/app-context/useConfig');
vi.mock('../billing-address/containers/useEditBillingAddressModal');
vi.mock('@proton/payments/telemetry/telemetry', () => ({
    checkoutTelemetry: {
        reportPayment: vi.fn(),
    },
}));
vi.mock('./ChargebeePaypalButton', () => ({
    ChargebeePaypalButton: vi.fn(() => <div data-testid="chargebee-paypal-button" />),
}));
vi.mock('./ApplePayButton', () => ({
    ApplePayButton: vi.fn(() => <div data-testid="apple-pay-button" />),
}));
vi.mock('./GooglePayButton', () => ({
    GooglePayButton: vi.fn(() => <div data-testid="google-pay-button" />),
}));
vi.mock('./ChargebeeIdealButton', () => ({
    ChargebeeIdealButton: vi.fn(() => <div data-testid="chargebee-ideal-button" />),
}));

const mockUseConfig = vi.mocked(useConfig);
const mockUseEditBillingAddressModal = vi.mocked(useEditBillingAddressModal);
const mockReportPayment = vi.mocked(checkoutTelemetry.reportPayment);

function createTaxCountry(overrides: Partial<TaxCountryHook> = {}): TaxCountryHook {
    return {
        selectedCountryCode: 'DE',
        setSelectedCountry: vi.fn(),
        federalStateCode: null,
        setFederalStateCode: vi.fn(),
        zipCode: null,
        setZipCode: vi.fn(),
        billingAddressValid: true,
        billingAddressStatus: BILLING_ADDRESS_VALID,
        zipCodeBackendValid: true,
        paymentsApi: {} as PaymentsApi,
        billingAddressChangedInModal: vi.fn(),
        ...overrides,
    };
}

function createPaymentFacade(overrides: Record<string, unknown> = {}) {
    return {
        selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        selectedMethodType: 'card',
        amount: 1000,
        subscription: buildSubscription(),
        currency: 'USD',
        user: { Currency: 'USD' },
        checkResult: {
            Cycle: 12,
            requestData: { Plans: {}, Currency: 'USD', Cycle: 12 },
            Coupon: null,
            AmountDue: 1000,
        },
        chargebeePaypal: {},
        applePay: {},
        googlePay: {},
        iframeHandles: {},
        ...overrides,
    } as any;
}

function renderPayButton(
    options: {
        taxCountry?: TaxCountryHook;
        paymentFacade?: ReturnType<typeof createPaymentFacade>;
        vatNumber?: VatNumberHook;
        children?: ReactNode;
        disabled?: boolean;
        onClick?: Mock;
        isAuthenticated?: boolean;
        showIdealAuthorizationNote?: boolean;
    } = {}
) {
    const taxCountry = options.taxCountry ?? createTaxCountry();
    const paymentFacade = options.paymentFacade ?? createPaymentFacade();

    return renderWithProviders(
        <PayButton
            product="proton-mail"
            telemetryContext="subscription-modification"
            taxCountry={taxCountry}
            paymentFacade={paymentFacade}
            vatNumber={options.vatNumber}
            disabled={options.disabled}
            onClick={options.onClick}
            isAuthenticated={options.isAuthenticated ?? false}
            showIdealAuthorizationNote={options.showIdealAuthorizationNote}
            data-testid="pay-cta"
        >
            {options.children ?? 'Pay now'}
        </PayButton>
    );
}

describe('PayButton', () => {
    let openBillingAddressModal: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);
        openBillingAddressModal = vi.fn().mockResolvedValue(undefined);
        mockUseEditBillingAddressModal.mockReturnValue({
            editBillingAddressModal: null,
            openBillingAddressModal,
            loadingByKey: {},
        } as unknown as ReturnType<typeof useEditBillingAddressModal>);
    });

    describe('invalid billing address status', () => {
        it('shows danger banner and edit CTA when billingAddressErrorMessage is set', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                billingAddressErrorMessage: 'Please select billing country',
            });

            renderPayButton({ taxCountry, isAuthenticated: true });

            expect(screen.getByText('Please select billing country')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit billing address' })).toBeInTheDocument();
        });

        it('does not render banner text when billingAddressErrorMessage is unset', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                billingAddressErrorMessage: undefined,
            });

            renderPayButton({ taxCountry, isAuthenticated: true });

            expect(screen.queryByText('Please select billing country')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit billing address' })).toBeInTheDocument();
        });

        it('calls openBillingAddressModal when Edit billing address is clicked', async () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                paymentsApi: { getFullBillingAddress: vi.fn() } as unknown as PaymentsApi,
            });
            const paymentFacade = createPaymentFacade();

            renderPayButton({ taxCountry, paymentFacade, isAuthenticated: true });

            fireEvent.click(screen.getByRole('button', { name: 'Edit billing address' }));

            expect(openBillingAddressModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    subscription: paymentFacade.subscription,
                    paymentsApi: taxCountry.paymentsApi,
                    taxCountry,
                    loadingKey: 'editBillingAddress',
                })
            );
        });
    });

    describe('valid billing address (card)', () => {
        it('renders submit button with children when address is valid and there is no inline error', () => {
            renderPayButton();

            const button = screen.getByRole('button', { name: 'Pay now' });
            expect(button).toHaveAttribute('type', 'submit');
            expect(button).not.toBeDisabled();
        });

        it('disables submit when billingAddressValid is false', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: BILLING_ADDRESS_VALID,
                billingAddressValid: false,
            });

            renderPayButton({ taxCountry });

            expect(screen.getByRole('button', { name: 'Pay now' })).toBeDisabled();
        });

        it('wraps submit in Tooltip when billingAddressErrorMessage is set while status is valid', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: BILLING_ADDRESS_VALID,
                billingAddressValid: true,
                billingAddressErrorMessage: 'ZIP code looks wrong',
            });

            renderPayButton({ taxCountry });

            const button = screen.getByRole('button', { name: 'Pay now' });
            expect(button.parentElement).toHaveAttribute('aria-describedby');
        });

        it('wraps submit in Tooltip when VAT form is invalid and errors are checked inline', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: BILLING_ADDRESS_VALID,
                billingAddressValid: true,
            });
            const vatNumber = {
                shouldEditInModal: false,
                vatFormValid: false,
                vatFormErrorMessage: 'Please complete the billing details',
            } as VatNumberHook;

            renderPayButton({ taxCountry, vatNumber });

            const button = screen.getByRole('button', { name: 'Pay now' });
            expect(button.parentElement).toHaveAttribute('aria-describedby');
        });

        it('reports checkout telemetry on card submit click', () => {
            const onClick = vi.fn();
            renderPayButton({ onClick });

            fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));

            expect(mockReportPayment).toHaveBeenCalled();
            expect(onClick).toHaveBeenCalledWith({ type: 'card', source: 'real-button' });
        });
    });

    describe('payment method branches', () => {
        it('renders ChargebeePaypalButton when PayPal is selected', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            });

            renderPayButton({ paymentFacade });

            expect(screen.getByTestId('chargebee-paypal-button')).toBeInTheDocument();
        });

        it('renders ApplePayButton when Apple Pay is selected', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY,
            });

            renderPayButton({ paymentFacade });

            expect(screen.getByTestId('apple-pay-button')).toBeInTheDocument();
        });

        it('renders GooglePayButton when Google Pay is selected', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
            });

            renderPayButton({ paymentFacade });

            expect(screen.getByTestId('google-pay-button')).toBeInTheDocument();
        });

        it('renders the iDEAL authorization note under the button when iDEAL is selected', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                chargebeeIdeal: { accountHolderNameMissing: false },
            });

            renderPayButton({ paymentFacade });

            expect(screen.getByTestId('chargebee-ideal-button')).toBeInTheDocument();
            expect(screen.getByText(getIdealAuthorizationText())).toBeInTheDocument();
        });

        it('does not render the iDEAL authorization note when showIdealAuthorizationNote is false', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                chargebeeIdeal: { accountHolderNameMissing: false },
            });

            renderPayButton({ paymentFacade, showIdealAuthorizationNote: false });

            expect(screen.queryByText(getIdealAuthorizationText())).not.toBeInTheDocument();
        });

        it('does not render the iDEAL authorization note when nothing is charged', () => {
            const paymentFacade = createPaymentFacade({
                selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                chargebeeIdeal: { accountHolderNameMissing: false },
                amount: 0,
            });

            renderPayButton({ paymentFacade });

            expect(screen.queryByText(getIdealAuthorizationText())).not.toBeInTheDocument();
        });

        it('does not render the iDEAL authorization note when card is selected', () => {
            renderPayButton();

            expect(screen.queryByText(getIdealAuthorizationText())).not.toBeInTheDocument();
        });
    });

    describe('button per payment method', () => {
        it.each([
            [
                PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                ChargebeePaypalButton,
                'chargebee-paypal-button',
                '100%',
                undefined,
            ],
            [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, ChargebeeIdealButton, 'chargebee-ideal-button', '100%', 'pay-cta'],
            [PAYMENT_METHOD_TYPES.APPLE_PAY, ApplePayButton, 'apple-pay-button', undefined, undefined],
            [PAYMENT_METHOD_TYPES.GOOGLE_PAY, GooglePayButton, 'google-pay-button', undefined, undefined],
        ])('renders the dedicated button for %s', (method, component, testId, width, forwardedTestId) => {
            const onClick = vi.fn();
            const paymentFacade = createPaymentFacade({ selectedMethodValue: method, chargebeeIdeal: {} });

            renderPayButton({
                paymentFacade,
                taxCountry: createTaxCountry({ billingAddressValid: false }),
                disabled: false,
                onClick,
            });

            expect(screen.getByTestId(testId)).toBeInTheDocument();
            expect(screen.queryByTestId('pay-cta')).not.toBeInTheDocument();
            const props = (component as Mock).mock.lastCall![0];
            expect(props.disabled).toBe(true);
            expect(props.width).toBe(width);
            expect(props['data-testid']).toBe(forwardedTestId);

            props.onClick({ type: 'paypal', source: 'real-button' });

            expect(mockReportPayment).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethodValue: method, amount: 1000 })
            );
            expect(onClick).toHaveBeenCalledWith({ type: 'paypal', source: 'real-button' });
        });

        it.each([
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            PAYMENT_METHOD_TYPES.CASH,
            PAYMENT_METHOD_TYPES.TOKEN,
            'saved-payment-method-id',
            undefined,
        ])('renders the submit button for %s', (method) => {
            const onClick = vi.fn();
            const paymentFacade = createPaymentFacade({ selectedMethodValue: method });

            renderPayButton({ paymentFacade, onClick });

            const button = screen.getByTestId('pay-cta');
            expect(button).toHaveAttribute('type', 'submit');
            expect(button).toHaveTextContent('Pay now');
            expect(screen.queryByTestId('chargebee-paypal-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chargebee-ideal-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('google-pay-button')).not.toBeInTheDocument();

            fireEvent.click(button);

            expect(mockReportPayment).toHaveBeenCalledWith(expect.objectContaining({ paymentMethodValue: method }));
            expect(onClick).toHaveBeenCalledWith({ type: 'card', source: 'real-button' });
        });
    });
});
