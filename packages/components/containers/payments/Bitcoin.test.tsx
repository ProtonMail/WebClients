import { render, waitFor } from '@testing-library/react';

import { PAYMENT_TOKEN_STATUS } from '@proton/components/payments/core';
import { createToken, getTokenStatus } from '@proton/shared/lib/api/payments';
import { addApiMock, apiMock, applyHOCs, flushPromises, withApi, withConfig } from '@proton/testing';

import Bitcoin from './Bitcoin';

const onTokenValidated = jest.fn();
const BitcoinContext = applyHOCs(withApi(), withConfig())(Bitcoin);

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
        <BitcoinContext
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
        <BitcoinContext
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
        <BitcoinContext
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
        <BitcoinContext
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

    jest.advanceTimersByTime(11000);
    await flushPromises();

    expect(onTokenValidated).toHaveBeenCalledTimes(1); // check that it's called only once
});

it('should render Try again button in case of error', async () => {
    addApiMock(createTokenUrl, () => {
        return Promise.reject('error');
    });

    const { queryByTestId, container } = render(
        <BitcoinContext
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
        <BitcoinContext
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
        <BitcoinContext
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
