import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PAYMENT_TOKEN_STATUS } from '@proton/components/payments/core';
import { buyCredit, createToken } from '@proton/shared/lib/api/payments';
import {
    addApiMock,
    applyHOCs,
    mockEventManager,
    mockPaymentMethods,
    mockPaymentStatus,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withDeprecatedModals,
    withEventManager,
    withNotifications,
} from '@proton/testing';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PaymentMethodSelector from '../paymentMethods/PaymentMethodSelector';
import CreditsModal from './CreditsModal';

jest.mock('@proton/components/components/portal/Portal');

const createTokenMock = jest.fn((request) => {
    const type = request?.data?.Payment?.Type ?? '';
    let Token: string;
    if (type === 'paypal') {
        Token = 'paypal-payment-token-123';
    } else if (type === 'paypal-credit') {
        Token = 'paypal-credit-payment-token-123';
    } else {
        Token = 'payment-token-123';
    }

    return {
        Token,
        Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
    };
});

const buyCreditUrl = buyCredit({} as any).url;
const buyCreditMock = jest.fn().mockResolvedValue({});

beforeEach(() => {
    jest.clearAllMocks();

    // That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
    (window as any).SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

    addApiMock(createToken({} as any).url, createTokenMock);
    addApiMock(buyCreditUrl, buyCreditMock);

    mockPaymentStatus();
    mockPaymentMethods().noSaved();
});

const ContextCreditsModal = applyHOCs(
    withConfig(),
    withNotifications(),
    withEventManager(),
    withApi(),
    withCache(),
    withDeprecatedModals(),
    withAuthentication()
)(CreditsModal);

it('should render', () => {
    const { container } = render(<ContextCreditsModal open={true} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should display the credit card form by default', async () => {
    const { findByTestId } = render(<ContextCreditsModal open={true} />);
    const ccname = await findByTestId('ccname');
    expect(ccname).toBeTruthy();
});

it('should display the payment method selector', async () => {
    const { queryByTestId } = render(<ContextCreditsModal open={true} />);

    await waitFor(() => {
        /**
         * That's essentially internals of {@link PaymentMethodSelector}
         **/
        expect(queryByTestId('payment-method-selector')).toBeTruthy();
    });
});

function selectMethod(container: HTMLElement, value: string) {
    const dropdownButton = container.querySelector('#select-method') as HTMLButtonElement;
    if (dropdownButton) {
        fireEvent.click(dropdownButton);
        const button = container.querySelector(`button[title="${value}"]`) as HTMLButtonElement;
        fireEvent.click(button);
        return;
    }

    const input = container.querySelector(`#${value}`) as HTMLInputElement;
    input.click();
}

it('should select the payment method when user clicks it', async () => {
    const { container, queryByTestId } = render(<ContextCreditsModal open={true} />);
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    // secondary check
    expect(queryByTestId('payment-method-selector')).toHaveTextContent('PayPal');

    // check that the credit card form is not displayed
    expect(queryByTestId('ccname')).toBeFalsy();

    expect(queryByTestId('paypal-view')).toBeTruthy();
    expect(queryByTestId('paypal-button')).toBeTruthy();

    // switching back to credit card
    selectMethod(container, 'New credit/debit card');
    expect(queryByTestId('ccname')).toBeTruthy();
    expect(queryByTestId('paypal-button')).toBeFalsy();
    expect(queryByTestId('top-up-button')).toBeTruthy();
});

it('should display the credit card form initially', async () => {
    const { queryByTestId } = render(<ContextCreditsModal open={true} />);
    await waitFor(() => {
        expect(queryByTestId('ccname')).toBeTruthy();
    });
});

it('should remember credit card details when switching back and forth', async () => {
    const { container, queryByTestId } = render(<ContextCreditsModal open={true} />);
    await waitFor(() => {});

    const ccname = queryByTestId('ccname') as HTMLInputElement;
    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;

    userEvent.type(ccname, 'Arthur Morgan');
    userEvent.type(ccnumber, '4242424242424242');
    userEvent.type(exp, '1232');
    userEvent.type(cvc, '123');

    // switching to paypal
    selectMethod(container, 'PayPal');
    expect(queryByTestId('paypal-view')).toBeTruthy();

    // switching back to credit card
    selectMethod(container, 'New credit/debit card');

    expect((queryByTestId('ccname') as HTMLInputElement).value).toBe('Arthur Morgan');
    expect((queryByTestId('ccnumber') as HTMLInputElement).value).toBe('4242 4242 4242 4242');
    expect((queryByTestId('exp') as HTMLInputElement).value).toBe('12/32');
    expect((queryByTestId('cvc') as HTMLInputElement).value).toBe('123');
});

it('should display validation errors after user submits credit card', async () => {
    const { container, findByTestId, queryByTestId } = render(<ContextCreditsModal open={true} />);
    const ccname = queryByTestId('ccname') as HTMLInputElement;
    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;

    userEvent.type(ccname, 'Arthur Morgan');
    userEvent.type(ccnumber, '1234567812345678');
    userEvent.type(exp, '1212');
    userEvent.type(cvc, '123');

    const cardError = 'Invalid card number';
    const expError = 'Invalid expiration date';
    const zipError = 'Invalid postal code';

    expect(container).not.toHaveTextContent(cardError);
    expect(container).not.toHaveTextContent(expError);
    expect(container).not.toHaveTextContent(zipError);

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    expect(container).toHaveTextContent(cardError);
    expect(container).toHaveTextContent(expError);
    expect(container).toHaveTextContent(zipError);
});

it('should create payment token and then buy credits with it', async () => {
    const onClose = jest.fn();
    const { findByTestId, queryByTestId } = render(<ContextCreditsModal open={true} onClose={onClose} />);
    await waitFor(() => {});

    const ccname = queryByTestId('ccname') as HTMLInputElement;
    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;
    const postalCode = queryByTestId('postalCode') as HTMLInputElement;

    userEvent.type(ccname, 'Arthur Morgan');
    userEvent.type(ccnumber, '4242424242424242');
    userEvent.type(exp, '1232');
    userEvent.type(cvc, '123');
    userEvent.type(postalCode, '11111');

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();

        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'payment-token-123',
                        }),
                    }),
                    Amount: 5000,
                    Currency: 'EUR',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );

        expect(mockEventManager.call).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});

it('should create payment token for paypal and then buy credits with it', async () => {
    const onClose = jest.fn();
    const { container, queryByTestId } = render(<ContextCreditsModal open={true} onClose={onClose} />);
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    const paypalButton = queryByTestId('paypal-button') as HTMLButtonElement;

    fireEvent.click(paypalButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();

        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'paypal-payment-token-123',
                        }),
                    }),
                    Amount: 5000,
                    Currency: 'EUR',
                    type: 'paypal',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );

        expect(mockEventManager.call).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});

it('should create payment token for paypal-credit and then buy credits with it', async () => {
    const onClose = jest.fn();
    const { container, queryByTestId } = render(<ContextCreditsModal open={true} onClose={onClose} />);
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    const paypalCreditButton = queryByTestId('paypal-credit-button') as HTMLButtonElement;

    fireEvent.click(paypalCreditButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();

        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'paypal-credit-payment-token-123',
                        }),
                    }),
                    Amount: 5000,
                    Currency: 'EUR',
                    type: 'paypal-credit',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );

        expect(mockEventManager.call).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});

const paypalPayerId = 'AAAAAAAAAAAAA';
const paypalShort = `PayPal - ${paypalPayerId}`;

it('should display the saved credit cards', async () => {
    mockPaymentMethods().noSaved().withCard({
        Last4: '4242',
        Brand: 'Visa',
        ExpMonth: '01',
        ExpYear: '2025',
        Name: 'John Smith',
        Country: 'US',
        ZIP: '11111',
    });

    const { container, queryByTestId } = render(<ContextCreditsModal open={true} />);

    await waitFor(() => {
        expect(container.querySelector('#select-method')).toBeTruthy();
        expect(queryByTestId('existing-credit-card')).toBeTruthy();
    });

    expect(container).toHaveTextContent('Visa ending in 4242');
    expect(container).toHaveTextContent('•••• •••• •••• 4242');
    expect(container).toHaveTextContent('John Smith');
    expect(container).toHaveTextContent('01/2025');
});

it('should display the saved paypal account', async () => {
    mockPaymentMethods().noSaved().withPaypal({
        BillingAgreementID: 'B-22222222222222222',
        PayerID: paypalPayerId,
        Payer: '',
    });

    const { container, queryByTestId } = render(<ContextCreditsModal open={true} />);

    await waitFor(() => {
        expect(container.querySelector('#select-method')).toBeTruthy();
        selectMethod(container, paypalShort);
    });
    expect(queryByTestId('existing-paypal')).toBeTruthy();

    expect(container).toHaveTextContent('PayPal - AAAAAAAAAAAAA');
});

it('should create payment token for saved card and then buy credits with it', async () => {
    mockPaymentMethods().noSaved().withCard({
        Last4: '4242',
        Brand: 'Visa',
        ExpMonth: '01',
        ExpYear: '2025',
        Name: 'John Smith',
        Country: 'US',
        ZIP: '11111',
    });

    const onClose = jest.fn();
    const { container, findByTestId } = render(<ContextCreditsModal open={true} onClose={onClose} />);
    await waitFor(() => {
        selectMethod(container, 'Visa ending in 4242');
    });
    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'payment-token-123',
                        }),
                    }),
                    Amount: 5000,
                    Currency: 'EUR',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );

        expect(mockEventManager.call).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});

it('should create payment token for saved paypal and then buy credits with it', async () => {
    mockPaymentMethods().noSaved().withPaypal({
        BillingAgreementID: 'B-22222222222222222',
        PayerID: paypalPayerId,
        Payer: '',
    });

    const onClose = jest.fn();
    const { container, findByTestId } = render(<ContextCreditsModal open={true} onClose={onClose} />);

    await waitFor(() => {
        selectMethod(container, paypalShort);
    });

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            // The saved paypal method isn't handled by paypal hook.
                            // It's handled by the same hook as the saved credit card.
                            // That's why the mocked token isn't taken from the paypal mock this time.
                            Token: 'payment-token-123',
                        }),
                    }),
                    Amount: 5000,
                    Currency: 'EUR',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );

        expect(mockEventManager.call).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
