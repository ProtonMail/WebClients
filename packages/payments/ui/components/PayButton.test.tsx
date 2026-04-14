import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { buildSubscription } from '@proton/testing/builders';

import { BILLING_ADDRESS_VALID } from '../../core/billing-address/billing-address';
import { PAYMENT_METHOD_TYPES } from '../../core/constants';
import type { PaymentsApi } from '../../core/interface';
import { checkoutTelemetry } from '../../telemetry/telemetry';
import { useEditBillingAddressModal } from '../billing-address/containers/useEditBillingAddressModal';
import type { TaxCountryHook } from '../billing-address/hooks/useTaxCountry';
import type { VatNumberHook } from '../billing-address/hooks/useVatNumber';
import { PayButton } from './PayButton';

jest.mock('@proton/components/hooks/useConfig');
jest.mock('../billing-address/containers/useEditBillingAddressModal');
jest.mock('../../telemetry/telemetry', () => ({
    checkoutTelemetry: {
        reportPayment: jest.fn(),
    },
}));
jest.mock('./ChargebeePaypalButton', () => ({
    ChargebeePaypalButton: () => <div data-testid="chargebee-paypal-button" />,
}));
jest.mock('./ApplePayButton', () => ({
    ApplePayButton: () => <div data-testid="apple-pay-button" />,
}));
jest.mock('./GooglePayButton', () => ({
    GooglePayButton: () => <div data-testid="google-pay-button" />,
}));

const mockUseConfig = jest.mocked(useConfig);
const mockUseEditBillingAddressModal = jest.mocked(useEditBillingAddressModal);
const mockReportPayment = jest.mocked(checkoutTelemetry.reportPayment);

function createTaxCountry(overrides: Partial<TaxCountryHook> = {}): TaxCountryHook {
    return {
        selectedCountryCode: 'CH',
        setSelectedCountry: jest.fn(),
        federalStateCode: null,
        setFederalStateCode: jest.fn(),
        zipCode: null,
        setZipCode: jest.fn(),
        billingAddressValid: true,
        billingAddressStatus: BILLING_ADDRESS_VALID,
        zipCodeBackendValid: true,
        paymentsApi: {} as PaymentsApi,
        billingAddressChangedInModal: jest.fn(),
        ...overrides,
    };
}

function createPaymentFacade(overrides: Record<string, unknown> = {}) {
    return {
        selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        selectedMethodType: 'card',
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
        onClick?: jest.Mock;
    } = {}
) {
    const taxCountry = options.taxCountry ?? createTaxCountry();
    const paymentFacade = options.paymentFacade ?? createPaymentFacade();

    return render(
        <PayButton
            product="proton-mail"
            telemetryContext="subscription-modification"
            taxCountry={taxCountry}
            paymentFacade={paymentFacade}
            vatNumber={options.vatNumber}
            disabled={options.disabled}
            onClick={options.onClick}
            data-testid="pay-cta"
        >
            {options.children ?? 'Pay now'}
        </PayButton>
    );
}

describe('PayButton', () => {
    let openBillingAddressModal: jest.Mock;

    beforeEach(() => {
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL } as ReturnType<typeof useConfig>);
        openBillingAddressModal = jest.fn().mockResolvedValue(undefined);
        mockUseEditBillingAddressModal.mockReturnValue({
            editBillingAddressModal: null,
            openBillingAddressModal,
            loadingByKey: {},
        } as unknown as ReturnType<typeof useEditBillingAddressModal>);
        mockReportPayment.mockClear();
    });

    describe('invalid billing address status', () => {
        it('shows danger banner and edit CTA when billingAddressErrorMessage is set', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                billingAddressErrorMessage: 'Please select billing country',
            });

            renderPayButton({ taxCountry });

            expect(screen.getByText('Please select billing country')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit billing address' })).toBeInTheDocument();
        });

        it('does not render banner text when billingAddressErrorMessage is unset', () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                billingAddressErrorMessage: undefined,
            });

            renderPayButton({ taxCountry });

            expect(screen.queryByText('Please select billing country')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit billing address' })).toBeInTheDocument();
        });

        it('calls openBillingAddressModal when Edit billing address is clicked', async () => {
            const taxCountry = createTaxCountry({
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
                paymentsApi: { getFullBillingAddress: jest.fn() } as unknown as PaymentsApi,
            });
            const paymentFacade = createPaymentFacade();

            renderPayButton({ taxCountry, paymentFacade });

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
            const onClick = jest.fn();
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
    });
});
