import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { buyCredit } from '@proton/payments/core/api/api';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { MOCK_PAYMENT_STATUS, mockPaymentMethods, mockPaymentStatus } from '@proton/payments/testing/api-endpoints';
import { APPS } from '@proton/shared/lib/constants';
import { addApiMock } from '@proton/test-api/api';

import { applyHOCs } from '../../testing/hocs/helpers';
import { withApi } from '../../testing/hocs/with-api';
import { withAuthentication } from '../../testing/with-authentication';
import { withCache } from '../../testing/with-cache';
import { withConfig } from '../../testing/with-config';
import { withDeprecatedModals } from '../../testing/with-deprecated-modals';
import { withEventManager } from '../../testing/with-event-manager';
import { withNotifications } from '../../testing/with-notifications';
import { withReduxStore } from '../../testing/with-redux-store';
import { CreditsModal } from './CreditsModal';
import { LumoCreditsModal } from './LumoCreditsModal';

jest.mock('@proton/atoms/Portal/Portal');

const mockFacadeCalls: any[] = [];
const mockFacadeResults: any[] = [];
jest.mock('@proton/payments-ui/client-extensions/usePaymentFacade', () => {
    const actual = jest.requireActual('@proton/payments-ui/client-extensions/usePaymentFacade');
    return {
        ...actual,
        usePaymentFacade: (params: any) => {
            mockFacadeCalls.push(params);
            const result = actual.usePaymentFacade(params);
            mockFacadeResults.push(result);
            return result;
        },
    };
});

const buyProductUrl = 'payments/v5/products';
const buyProductMock = jest.fn().mockResolvedValue({});
const buyCreditMock = jest.fn().mockResolvedValue({});

beforeEach(() => {
    jest.clearAllMocks();
    mockFacadeCalls.length = 0;
    mockFacadeResults.length = 0;

    (window as any).SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

    addApiMock(buyProductUrl, buyProductMock);
    addApiMock(buyCredit({} as any).url, buyCreditMock);

    mockPaymentStatus();
});

const withContext = applyHOCs(
    withConfig(),
    withReduxStore(),
    withNotifications(),
    withEventManager(),
    withApi(),
    withCache(),
    withDeprecatedModals(),
    withAuthentication()
);
const ContextLumoCreditsModal = withContext(LumoCreditsModal);
const ContextCreditsModal = withContext(CreditsModal);

const getOfferedNewMethodTypes = async () => {
    await waitFor(() => expect(mockFacadeResults.at(-1)?.methods.loading).toBe(false));
    return mockFacadeResults.at(-1).methods.newMethods.map(({ type }: { type: string }) => type);
};

it('should render the Lumo top-up copy', async () => {
    mockPaymentMethods().noSaved();

    render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);

    expect(await screen.findByText('Add funds')).toBeInTheDocument();
    expect(screen.getByText(/Top up your Lumo API balance/)).toBeInTheDocument();
});

it('should buy the lumo-credit product once the payment is chargeable', async () => {
    mockPaymentMethods().noSaved();

    const onClose = jest.fn();
    render(
        <ContextLumoCreditsModal
            paymentStatus={MOCK_PAYMENT_STATUS}
            open={true}
            onClose={onClose}
            app={APPS.PROTONLUMO}
        />
    );
    await waitFor(() => expect(mockFacadeCalls.length).toBeGreaterThan(0));

    const chargeablePaymentParameters = { Amount: 5000, Currency: 'EUR', PaymentToken: 'payment-token-123' };
    const { onChargeable } = mockFacadeCalls[mockFacadeCalls.length - 1];
    await act(() => onChargeable({}, { chargeablePaymentParameters, sourceType: 'card' }));

    expect(buyProductMock).toHaveBeenCalledWith(
        expect.objectContaining({
            url: buyProductUrl,
            method: 'post',
            data: {
                ProductType: 'lumo-credit',
                Quantity: 50,
                Amount: 5000,
                Currency: 'EUR',
                PaymentToken: 'payment-token-123',
                BillingAddress: {
                    CountryCode: MOCK_PAYMENT_STATUS.CountryCode,
                    State: MOCK_PAYMENT_STATUS.State,
                    ZipCode: MOCK_PAYMENT_STATUS.ZipCode,
                },
            },
        })
    );
    expect(buyCreditMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
});

it('should only accept whole currency units, so the lumo-credit Quantity stays an integer', async () => {
    mockPaymentMethods().noSaved();

    render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
    const otherAmount = await screen.findByTestId('other-amount');

    fireEvent.change(otherAmount, { target: { value: '12.34' } });
    expect(otherAmount).toHaveValue('');

    fireEvent.change(otherAmount, { target: { value: '12' } });
    await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(1200));
});

it('should not offer Bitcoin, unlike the regular credits modal', async () => {
    mockPaymentMethods().noSaved();

    const { unmount } = render(
        <ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />
    );
    expect(await getOfferedNewMethodTypes()).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN);
    unmount();
    mockFacadeResults.length = 0;

    render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
    const lumoMethods = await getOfferedNewMethodTypes();
    expect(lumoMethods).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    expect(lumoMethods).not.toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN);
});
