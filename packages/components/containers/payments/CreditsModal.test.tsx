import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PAYMENT_TOKEN_STATUS, buyCredit, createTokenV4 } from '@proton/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
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

import CreditsModal from './CreditsModal';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PaymentMethodSelector from './methods/PaymentMethodSelector';

jest.mock('@proton/components/components/portal/Portal');

const createTokenMock = jest.fn((request) => {
    const type = request?.data?.Payment?.Type ?? '';
    let Token: string;
    if (type === 'paypal') {
        Token = 'paypal-payment-token-123';
    } else {
        Token = 'payment-token-123';
    }

    return {
        Token,
        Status: PAYMENT_TOKEN_STATUS.CHARGEABLE,
    };
});

const buyCreditUrl = buyCredit({} as any, 'v4').url;
const buyCreditMock = jest.fn().mockResolvedValue({});

beforeEach(() => {
    jest.clearAllMocks();

    // That's an unresolved issue of jsdom https://github.com/jsdom/jsdom/issues/918
    (window as any).SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

    addApiMock(createTokenV4({} as any).url, createTokenMock);
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

const status = {} as any;

it.skip('should render', () => {
    const { container } = render(<ContextCreditsModal paymentStatus={status} open={true} />);

    expect(container).not.toBeEmptyDOMElement();
});

it.skip('should display the credit card form by default', async () => {
    const { findByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);
    const ccnumber = await findByTestId('ccnumber');
    expect(ccnumber).toBeTruthy();
});

it.skip('should display the payment method selector', async () => {
    const { queryByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);

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

it.skip('should select the payment method when user clicks it', async () => {
    const { container, queryByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    // secondary check
    expect(queryByTestId('payment-method-selector')).toHaveTextContent('PayPal');

    // check that the credit card form is not displayed
    expect(queryByTestId('ccnumber')).toBeFalsy();

    expect(queryByTestId('paypal-view')).toBeTruthy();
    expect(queryByTestId('paypal-button')).toBeTruthy();

    // switching back to credit card
    selectMethod(container, 'New credit/debit card');
    expect(queryByTestId('ccnumber')).toBeTruthy();
    expect(queryByTestId('paypal-button')).toBeFalsy();
    expect(queryByTestId('top-up-button')).toBeTruthy();
});

it.skip('should display the credit card form initially', async () => {
    const { queryByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);
    await waitFor(() => {
        expect(queryByTestId('ccnumber')).toBeTruthy();
    });
});

it.skip('should remember credit card details when switching back and forth', async () => {
    const { container, getByTestId, findByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);
    await waitFor(() => {});

    const ccnumber = await findByTestId('ccnumber');
    const exp = getByTestId('exp') as HTMLInputElement;
    const cvc = getByTestId('cvc') as HTMLInputElement;

    await userEvent.type(ccnumber, '4242424242424242');
    await userEvent.type(exp, '1232');
    await userEvent.type(cvc, '123');

    // switching to paypal
    selectMethod(container, 'PayPal');
    expect(getByTestId('paypal-view')).toBeTruthy();

    // switching back to credit card
    selectMethod(container, 'New credit/debit card');

    expect((getByTestId('ccnumber') as HTMLInputElement).value).toBe('4242 4242 4242 4242');
    expect((getByTestId('exp') as HTMLInputElement).value).toBe('12/32');
    expect((getByTestId('cvc') as HTMLInputElement).value).toBe('123');
});

it.skip('should display validation errors after user submits credit card', async () => {
    const { container, findByTestId, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} />
    );
    await waitFor(() => {});
    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;

    await userEvent.type(ccnumber, '1234567812345678');
    await userEvent.type(exp, '1212');
    await userEvent.type(cvc, '123');

    const cardError = 'Invalid card number';
    const zipError = 'Invalid postal code';

    expect(container).not.toHaveTextContent(cardError);
    expect(container).not.toHaveTextContent(zipError);

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    expect(container).toHaveTextContent(cardError);
    expect(container).toHaveTextContent(zipError);
});

// todo: this test is no longer valid after Chargebee migration. For the update, the only viable option seems to
// mock the CB iframe response.
it.skip('should display invalid expiration date error', async () => {
    const { container, findByTestId, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} />
    );
    await waitFor(() => {});

    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;

    await userEvent.type(ccnumber, '4242424242424242');
    await userEvent.type(exp, '1212');
    await userEvent.type(cvc, '123');

    const expError = 'Invalid expiration date';

    expect(container).not.toHaveTextContent(expError);

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    expect(container).toHaveTextContent(expError);
});

// todo: this test is no longer valid after Chargebee migration. For the update, the only viable option seems to
// mock the CB iframe response.
it.skip('should create payment token and then buy credits with it', async () => {
    const onClose = jest.fn();
    const { findByTestId, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );
    await waitFor(() => {});

    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;
    const postalCode = queryByTestId('postalCode') as HTMLInputElement;

    await userEvent.type(ccnumber, '4242424242424242');
    await userEvent.type(exp, '1232');
    await userEvent.type(cvc, '123');
    await userEvent.type(postalCode, '11111');

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });

    await waitFor(() => {
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
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});

// todo: this test is no longer valid after Chargebee migration. For the update, the only viable option seems to
// mock the CB iframe response.
it.skip('should create payment token and then buy credits with it - custom amount', async () => {
    const onClose = jest.fn();
    const { findByTestId, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );
    await waitFor(() => {});

    const otherAmountInput = queryByTestId('other-amount') as HTMLInputElement;
    await userEvent.type(otherAmountInput, '123');

    const ccnumber = queryByTestId('ccnumber') as HTMLInputElement;
    const exp = queryByTestId('exp') as HTMLInputElement;
    const cvc = queryByTestId('cvc') as HTMLInputElement;
    const postalCode = queryByTestId('postalCode') as HTMLInputElement;

    await userEvent.type(ccnumber, '4242424242424242');
    await userEvent.type(exp, '1232');
    await userEvent.type(cvc, '123');
    await userEvent.type(postalCode, '11111');

    await wait(500);
    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'payment-token-123',
                        }),
                    }),
                    Amount: 12300,
                    Currency: 'EUR',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});

it.skip('should create payment token for paypal and then buy credits with it', async () => {
    const onClose = jest.fn();
    const { container, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    const paypalButton = queryByTestId('paypal-button') as HTMLButtonElement;

    fireEvent.click(paypalButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });

    await waitFor(() => {
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
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});

it.skip('should create payment token for paypal and then buy credits with it - custom amount', async () => {
    const onClose = jest.fn();
    const { container, queryByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );
    await waitFor(() => {
        selectMethod(container, 'PayPal');
    });

    const otherAmountInput = queryByTestId('other-amount') as HTMLInputElement;
    await userEvent.type(otherAmountInput, '123');

    await wait(1000);
    const paypalButton = queryByTestId('paypal-button') as HTMLButtonElement;
    fireEvent.click(paypalButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    Payment: expect.objectContaining({
                        Type: 'token',
                        Details: expect.objectContaining({
                            Token: 'paypal-payment-token-123',
                        }),
                    }),
                    Amount: 12300,
                    Currency: 'EUR',
                    type: 'paypal',
                }),
                method: 'post',
                url: buyCreditUrl,
            })
        );
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});

const paypalPayerId = 'AAAAAAAAAAAAA';
const paypalShort = `PayPal - ${paypalPayerId}`;

it.skip('should display the saved credit cards', async () => {
    mockPaymentMethods().noSaved().withCard({
        Last4: '4242',
        Brand: 'Visa',
        ExpMonth: '01',
        ExpYear: '2025',
        Name: 'John Smith',
        Country: 'US',
        ZIP: '11111',
    });

    const { container, queryByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);

    await waitFor(() => {
        expect(container.querySelector('#select-method')).toBeTruthy();
    });
    await waitFor(() => {
        expect(queryByTestId('existing-credit-card')).toBeTruthy();
    });

    expect(container).toHaveTextContent('Visa ending in 4242');
    expect(container).toHaveTextContent('•••• •••• •••• 4242');
    expect(container).toHaveTextContent('John Smith');
    expect(container).toHaveTextContent('01/2025');
});

it.skip('should display the saved paypal account', async () => {
    mockPaymentMethods().noSaved().withPaypal({
        BillingAgreementID: 'B-22222222222222222',
        PayerID: paypalPayerId,
        Payer: '',
    });

    const { container, queryByTestId } = render(<ContextCreditsModal paymentStatus={status} open={true} />);

    await waitFor(() => {
        expect(container.querySelector('#select-method')).toBeTruthy();
        selectMethod(container, paypalShort);
    });
    expect(queryByTestId('existing-paypal')).toBeTruthy();

    expect(container).toHaveTextContent('PayPal - AAAAAAAAAAAAA');
});

it.skip('should create payment token for saved card and then buy credits with it', async () => {
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
    const { container, findByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );
    await waitFor(() => {
        selectMethod(container, 'Visa ending in 4242');
    });
    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });
    await waitFor(() => {
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
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});

it.skip('should create payment token for saved paypal and then buy credits with it', async () => {
    mockPaymentMethods().noSaved().withPaypal({
        BillingAgreementID: 'B-22222222222222222',
        PayerID: paypalPayerId,
        Payer: '',
    });

    const onClose = jest.fn();
    const { container, findByTestId } = render(
        <ContextCreditsModal paymentStatus={status} open={true} onClose={onClose} />
    );

    await waitFor(() => {
        selectMethod(container, paypalShort);
    });

    const topUpButton = await findByTestId('top-up-button');
    fireEvent.click(topUpButton);

    await waitFor(() => {
        expect(buyCreditMock).toHaveBeenCalled();
    });
    await waitFor(() => {
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
    });

    await waitFor(() => {
        expect(mockEventManager.call).toHaveBeenCalled();
    });
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
    });
});
