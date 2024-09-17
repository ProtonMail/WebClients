import { act, render, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments';
import { createTokenV4, getTokenStatusV4 } from '@proton/shared/lib/api/payments';
import type { Api, Currency } from '@proton/shared/lib/interfaces';
import { addApiMock, apiMock, applyHOCs, flushPromises, withNotifications } from '@proton/testing';

import type { OnBitcoinTokenValidated } from '../../../payments/react-extensions/useBitcoin';
import useBitcoin, { BITCOIN_POLLING_INTERVAL } from '../../../payments/react-extensions/useBitcoin';
import Bitcoin from './Bitcoin';

const onTokenValidated = jest.fn();

type InnerProps = {
    onTokenValidated: OnBitcoinTokenValidated;
    api: Api;
    amount: number;
    currency: Currency;
    processingToken: boolean;
};

const BitcoinContext = applyHOCs(withNotifications())(Bitcoin);

const BitcoinTestComponent = (props: InnerProps) => {
    const bitcoinHook = useBitcoin({
        api: props.api,
        Amount: props.amount,
        Currency: props.currency,
        onTokenValidated: props.onTokenValidated,
        enablePolling: true,
        paymentsVersion: 'v4',
    });

    return <BitcoinContext {...props} {...bitcoinHook} />;
};

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

const createTokenUrl = createTokenV4({} as any).url;
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

    await waitFor(() => {
        expect(container).toHaveTextContent('address-123');
    });
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

    await waitFor(() => {
        expect(container).toHaveTextContent('address-123');
    });
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
    addApiMock(getTokenStatusV4('token-123').url, () => {
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

    await act(async () => {
        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();
    });

    addApiMock(getTokenStatusV4('token-123').url, function second() {
        return { Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE };
    });

    await act(async () => {
        jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
        await flushPromises();
    });

    expect(onTokenValidated).toHaveBeenCalledTimes(1);
    expect(onTokenValidated).toHaveBeenLastCalledWith({
        Amount: 1000,
        Currency: 'USD',
        PaymentToken: 'token-123',
        chargeable: true,
        type: PAYMENT_METHOD_TYPES.BITCOIN,
        v: 5,
    });

    jest.advanceTimersByTime(BITCOIN_POLLING_INTERVAL);
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
    });
    await waitFor(() => {
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
