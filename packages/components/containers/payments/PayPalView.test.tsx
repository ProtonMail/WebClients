import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { usePaypal } from '@proton/components/payments/react-extensions/usePaypal';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';
import type { Currency } from '@proton/shared/lib/interfaces';
import { apiMock, mockVerifyPayment } from '@proton/testing';

import PayPalView from './PayPalView';

const onChargeable = jest.fn();
const onClick = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

let amountAndCurrency = {
    Amount: 1000,
    Currency: 'EUR' as Currency,
};

function paypalHook({
    isCredit,
    Amount,
    Currency,
    mockVerificationResult,
}: {
    isCredit: boolean;
    mockVerificationResult?: boolean;
    Amount: number;
    Currency: Currency;
}) {
    const verifyPayment = mockVerifyPayment();
    if (mockVerificationResult) {
        verifyPayment.mockVerification();
    }

    return renderHook(
        ({ amountAndCurrency }) =>
            usePaypal(
                {
                    amountAndCurrency,
                    onChargeable,
                    isCredit,
                },
                {
                    api: apiMock,
                    verifyPayment: mockVerifyPayment(),
                }
            ),
        {
            initialProps: {
                amountAndCurrency: {
                    Amount,
                    Currency,
                },
            },
        }
    );
}

it('should render', () => {
    const { result: paypal } = paypalHook({ isCredit: false, ...amountAndCurrency });
    const { result: paypalCredit } = paypalHook({ isCredit: true, ...amountAndCurrency });

    const { container } = render(
        <PayPalView
            type="credit"
            paypal={paypal.current}
            paypalCredit={paypalCredit.current}
            onClick={onClick}
            amount={amountAndCurrency.Amount}
            currency={amountAndCurrency.Currency}
            showPaypalCredit={true}
            method={PAYMENT_METHOD_TYPES.PAYPAL_CREDIT}
        />
    );
    expect(container).not.toBeEmptyDOMElement();
});

it('should render the message of paypal credit and "click here" button', () => {
    const { result: paypal } = paypalHook({ isCredit: false, ...amountAndCurrency });
    const { result: paypalCredit } = paypalHook({ isCredit: true, ...amountAndCurrency });

    const { getByText, getByTestId } = render(
        <PayPalView
            type="credit"
            paypal={paypal.current}
            paypalCredit={paypalCredit.current}
            onClick={onClick}
            amount={amountAndCurrency.Amount}
            currency={amountAndCurrency.Currency}
            showPaypalCredit={true}
            method={PAYMENT_METHOD_TYPES.PAYPAL_CREDIT}
        />
    );

    const message = `You must have a credit card or bank account linked with your PayPal account. If your PayPal account doesn't have that, please click on the button below.`;
    expect(getByText(message)).toBeInTheDocument();
    expect(getByTestId('paypal-credit-button')).toBeInTheDocument();
});

it('should disable the "click here" button when triggers are disabled', () => {
    const { result: paypal } = paypalHook({ isCredit: false, ...amountAndCurrency });
    const { result: paypalCredit } = paypalHook({ isCredit: true, ...amountAndCurrency });

    const { getByTestId } = render(
        <PayPalView
            type="credit"
            paypal={paypal.current}
            paypalCredit={paypalCredit.current}
            onClick={onClick}
            amount={amountAndCurrency.Amount}
            currency={amountAndCurrency.Currency}
            triggersDisabled={true}
            showPaypalCredit={true}
            method={PAYMENT_METHOD_TYPES.PAYPAL_CREDIT}
        />
    );

    expect(getByTestId('paypal-credit-button')).toBeDisabled();
});

it('should disable the "click here" button when paypal credit is in initial state', () => {
    const { result: paypal } = paypalHook({ isCredit: false, ...amountAndCurrency });
    const { result: paypalCredit } = paypalHook({ isCredit: true, ...amountAndCurrency });

    const { getByTestId } = render(
        <PayPalView
            type="credit"
            paypal={paypal.current}
            paypalCredit={paypalCredit.current}
            onClick={onClick}
            amount={amountAndCurrency.Amount}
            currency={amountAndCurrency.Currency}
            showPaypalCredit={true}
            method={PAYMENT_METHOD_TYPES.PAYPAL_CREDIT}
        />
    );

    expect(getByTestId('paypal-credit-button')).toBeDisabled();
});
