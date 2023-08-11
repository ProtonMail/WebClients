import { render, waitFor } from '@testing-library/react';

import { createToken, getTokenStatus } from '@proton/shared/lib/api/payments';
import { addApiMock, apiMock, flushPromises } from '@proton/testing';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../../payments/core';
import Bitcoin, { Props } from './Bitcoin';
import useBitcoin from './useBitcoin';

const onTokenValidated = jest.fn();

const BitcoinTestComponent = (props: Omit<Props, 'model' | 'error' | 'loading' | 'request'>) => {
    const bitcoinHook = useBitcoin(props.api, {
        Amount: props.amount,
        Currency: props.currency,
    });

    return <Bitcoin {...props} {...bitcoinHook} />;
};

beforeAll(() => {
    jest.useFakeTimers();
});

afterAll(() => {
    jest.useRealTimers();
});

const createTokenUrl = createToken({} as any).url;
const defaultTokenResponse = {
    Token: 'token-123',
    Data: {
        CoinAddress: 'address-123',
        CoinAmount: '0.00135',
    },
};

beforeEach(() => {
    jest.clearAllMocks();

    addApiMock(createTokenUrl, () => defaultTokenResponse);
});

it('should render', async () => {
    const { container } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );
    await waitFor(() => {
        expect(container).not.toBeEmptyDOMElement();
    });

    expect(container).toHaveTextContent('address-123');
    expect(container).toHaveTextContent('0.00135');
});

it('should render for signup-pass', async () => {
    const { container } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );
    await waitFor(() => {
        expect(container).not.toBeEmptyDOMElement();
    });

    expect(container).toHaveTextContent('address-123');
    expect(container).toHaveTextContent('0.00135');
});

it('should show loading during the initial fetching', async () => {
    const { queryByTestId } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );

    expect(queryByTestId('circle-loader')).toBeInTheDocument();
});

it('should check the token every 10 seconds', async () => {
    addApiMock(getTokenStatus('token-123').url, () => {
        return { Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING };
    });

    render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );

    jest.advanceTimersByTime(11000);
    await flushPromises();

    addApiMock(getTokenStatus('token-123').url, function second() {
        return { Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE };
    });

    jest.advanceTimersByTime(11000);
    await flushPromises();

    expect(onTokenValidated).toHaveBeenCalledTimes(1);
    expect(onTokenValidated).toHaveBeenLastCalledWith({
        Payment: {
            Type: PAYMENT_METHOD_TYPES.TOKEN,
            Details: {
                Token: 'token-123',
            },
        },
        cryptoAddress: 'address-123',
        cryptoAmount: '0.00135',
    });

    jest.advanceTimersByTime(11000);
    await flushPromises();

    expect(onTokenValidated).toHaveBeenCalledTimes(1); // check that it's called only once
});

it('should render Try again button in case of error', async () => {
    addApiMock(createTokenUrl, () => {
        return Promise.reject('error');
    });

    const { queryByTestId, container } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );

    await waitFor(() => {
        expect(queryByTestId('bitcoin-try-again')).toBeInTheDocument();
    });

    addApiMock(createTokenUrl, () => defaultTokenResponse);

    queryByTestId('bitcoin-try-again')?.click();

    await waitFor(() => {
        expect(container).toHaveTextContent('address-123');
        expect(container).toHaveTextContent('0.00135');
    });
});

it('should render warning if the amount is too low', async () => {
    const { container } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={100}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );

    await waitFor(() => {
        expect(container).toHaveTextContent('Amount below minimum');
    });
});

it('should render warning if the amount is too high', async () => {
    const { container } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={4000100}
            currency="USD"
            onTokenValidated={onTokenValidated}
            processingToken={false}
        />
    );

    await waitFor(() => {
        expect(container).toHaveTextContent('Amount above maximum');
    });
});

it('should call awaitingPayment callback when the token is created', async () => {
    const onAwaitingPayment = jest.fn();

    render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            onAwaitingPayment={onAwaitingPayment}
            processingToken={false}
        />
    );

    expect(onAwaitingPayment).toHaveBeenLastCalledWith(false);

    await waitFor(() => {
        expect(onAwaitingPayment).toHaveBeenLastCalledWith(true);
    });
});

it('should call awaitingPayment callback when the token is validated', async () => {
    const onAwaitingPayment = jest.fn();

    render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            onAwaitingPayment={onAwaitingPayment}
            processingToken={false}
        />
    );

    jest.advanceTimersByTime(11000);
    await flushPromises();

    expect(onAwaitingPayment).toHaveBeenLastCalledWith(false);
});

it('should call awaitingPayment callback when amount or currency is changed', async () => {
    const onAwaitingPayment = jest.fn();

    const { rerender } = render(
        <BitcoinTestComponent
            api={apiMock}
            amount={1000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            onAwaitingPayment={onAwaitingPayment}
            processingToken={false}
        />
    );

    rerender(
        <BitcoinTestComponent
            api={apiMock}
            amount={2000}
            currency="USD"
            onTokenValidated={onTokenValidated}
            onAwaitingPayment={onAwaitingPayment}
            processingToken={false}
        />
    );

    jest.advanceTimersByTime(6000);
    await flushPromises();

    expect(onAwaitingPayment).toHaveBeenLastCalledWith(false);
});
