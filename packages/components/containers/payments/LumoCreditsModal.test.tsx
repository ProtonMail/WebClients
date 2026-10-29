import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { buyCredit } from '@proton/payments/core/api/api';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
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

const getOfferedMethodTypes = async () => {
    await waitFor(() => expect(mockFacadeResults.at(-1)?.methods.loading).toBe(false));
    return mockFacadeResults.at(-1).methods.allMethods.map(({ type }: { type: string }) => type);
};

const productRefusedMethods = [
    PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
    PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
    PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
];

const enableIdealFlag = () =>
    jest.spyOn(require('@proton/unleash/useFlag'), 'useFlag').mockImplementation((flag) => flag === 'EnableIdeal');

const bankAccount = { AccountName: 'Arthur Morgan', Country: 'NL', Last4: '1234' };

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

it('should not offer Cash, unlike the regular credits modal', async () => {
    mockPaymentMethods().noSaved();

    const { unmount } = render(
        <ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />
    );
    expect(await getOfferedNewMethodTypes()).toContain(PAYMENT_METHOD_TYPES.CASH);
    unmount();
    mockFacadeResults.length = 0;

    render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
    const lumoMethods = await getOfferedNewMethodTypes();
    expect(lumoMethods).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    expect(lumoMethods).not.toContain(PAYMENT_METHOD_TYPES.CASH);
});

describe('payment methods the BE refuses for products', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should not offer a new iDEAL, unlike the regular credits modal', async () => {
        enableIdealFlag();
        mockPaymentMethods().noSaved();
        const dutchPaymentStatus = { ...MOCK_PAYMENT_STATUS, CountryCode: 'NL' };

        const { unmount } = render(
            <ContextCreditsModal paymentStatus={dutchPaymentStatus} open={true} app={APPS.PROTONMAIL} />
        );
        expect(await getOfferedMethodTypes()).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL);
        unmount();
        mockFacadeResults.length = 0;

        render(<ContextLumoCreditsModal paymentStatus={dutchPaymentStatus} open={true} app={APPS.PROTONLUMO} />);
        const lumoMethods = await getOfferedMethodTypes();
        expect(lumoMethods).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        productRefusedMethods.forEach((type) => expect(lumoMethods).not.toContain(type));
    });

    it('should not offer or select a saved iDEAL mandate, unlike the regular credits modal, nor a saved SEPA one', async () => {
        const savedMethods: SavedPaymentMethod[] = [
            {
                ID: 'sepa',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                Order: 500,
                Autopay: Autopay.ENABLE,
                Details: bankAccount,
            },
            {
                ID: 'ideal',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                Order: 501,
                Autopay: Autopay.ENABLE,
                Details: bankAccount,
            },
        ];
        mockPaymentMethods({ PaymentMethods: savedMethods });

        const { unmount } = render(
            <ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />
        );
        const regularMethods = await getOfferedMethodTypes();
        expect(regularMethods).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL);
        expect(regularMethods).not.toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);
        unmount();
        mockFacadeResults.length = 0;

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        const lumoMethods = await getOfferedMethodTypes();
        expect(lumoMethods).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        productRefusedMethods.forEach((type) => expect(lumoMethods).not.toContain(type));
        expect(mockFacadeResults.at(-1).methods.selectedMethod?.type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    });
});
