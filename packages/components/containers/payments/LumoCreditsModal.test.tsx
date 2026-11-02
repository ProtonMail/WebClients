import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { buyCredit } from '@proton/payments/core/api/api';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import {
    LUMO_CREDIT_CHECK_TAX_EXCLUSIVE,
    MOCK_PAYMENT_STATUS,
    mockPaymentMethods,
    mockPaymentStatus,
} from '@proton/payments/testing/api-endpoints';
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
const checkProductUrl = 'payments/v5/products/check';
const checkProductMock = jest.fn();
const buyCreditMock = jest.fn().mockResolvedValue({});

const getCheckResponse = (data: { Quantity: number; Currency: string }) =>
    data.Quantity === 20
        ? { ...LUMO_CREDIT_CHECK_TAX_EXCLUSIVE, Currency: data.Currency }
        : {
              Currency: data.Currency,
              Amount: data.Quantity * 100,
              AmountDue: data.Quantity * 100,
              Credit: 0,
              TaxInclusive: 1,
              Taxes: [],
          };

const createDeferred = <T,>() => {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
};

beforeEach(() => {
    jest.clearAllMocks();
    mockFacadeCalls.length = 0;
    mockFacadeResults.length = 0;

    (window as any).SVGElement.prototype.getBBox = jest.fn().mockReturnValue({ width: 0 });

    addApiMock(buyProductUrl, buyProductMock);
    checkProductMock.mockImplementation(({ data }) => getCheckResponse(data));
    addApiMock(checkProductUrl, checkProductMock);
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

const typeCredits = async (credits: string) => {
    fireEvent.change(await screen.findByTestId('other-amount'), { target: { value: credits } });
};

const queryFooterPaypalButton = () =>
    within(document.querySelector<HTMLElement>('.modal-two-footer')!).queryByTestId('chargebee-iframe');

const minimumBannerText = /The minimum amount of credit that can be added is/;

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

describe('amount rules', () => {
    it('should require at least 20 credits', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('19');

        expect(await screen.findByText(minimumBannerText)).toHaveTextContent('20');
        expect(screen.getByTestId('top-up-button')).toBeDisabled();

        await typeCredits('20');

        await waitFor(() => expect(screen.queryByText(minimumBannerText)).not.toBeInTheDocument());
        await waitFor(() => expect(screen.getByTestId('top-up-button')).toBeEnabled());
    });

    it('should keep the regular minimum in the regular credits modal', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />);
        await typeCredits('19');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(1900));

        expect(screen.queryByText(minimumBannerText)).not.toBeInTheDocument();

        await typeCredits('4');

        expect(await screen.findByText(minimumBannerText)).toHaveTextContent('5');
    });
});

describe('tax', () => {
    it('should check the lumo-credit price of the typed credits', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');

        await waitFor(() =>
            expect(checkProductMock).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    url: checkProductUrl,
                    method: 'post',
                    data: {
                        ProductType: 'lumo-credit',
                        Quantity: 20,
                        Currency: mockFacadeCalls.at(-1).currency,
                        BillingAddress: {
                            CountryCode: MOCK_PAYMENT_STATUS.CountryCode,
                            State: MOCK_PAYMENT_STATUS.State,
                            ZipCode: MOCK_PAYMENT_STATUS.ZipCode,
                        },
                    },
                })
            )
        );
    });

    it('should show the credits, the tax and the total from the check', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');

        await waitFor(() => expect(screen.getByTestId('top-up-summary')).toHaveTextContent(/Credits\s*20\b/));
        const summary = screen.getByTestId('top-up-summary');
        expect(summary).toHaveTextContent(/Tax 8\.1%\s*1\.62/);
        expect(summary).toHaveTextContent(/Total\s*21\.62/);
        expect(screen.getByTestId('amountToCharge-text')).toHaveTextContent('21.62');
    });

    it('should show the tax included in the credits for a tax-inclusive check', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) =>
            data.Quantity === 20
                ? {
                      ...LUMO_CREDIT_CHECK_TAX_EXCLUSIVE,
                      Currency: data.Currency,
                      AmountDue: 2000,
                      TaxInclusive: 1,
                      Taxes: [{ Name: 'Mehrwertsteuer (MWST)', Rate: 8.1, Amount: 150 }],
                  }
                : getCheckResponse(data)
        );

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');

        await waitFor(() =>
            expect(screen.getByTestId('top-up-summary')).toHaveTextContent(/Including 8\.1% tax\s*1\.50/)
        );
        expect(screen.getByTestId('top-up-summary')).toHaveTextContent(/Total\s*20\b/);
    });

    it('should authorize the payment for the amount due, tax included', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');

        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue));
    });

    it('should buy the typed credits and pay the amount due', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue));

        const { onChargeable, currency } = mockFacadeCalls.at(-1);
        const chargeablePaymentParameters = {
            Amount: LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue,
            Currency: currency,
            PaymentToken: 'payment-token-123',
        };
        await act(() => onChargeable({}, { chargeablePaymentParameters, sourceType: 'card' }));

        expect(buyProductMock).toHaveBeenCalledWith(
            expect.objectContaining({
                url: buyProductUrl,
                data: expect.objectContaining({ Quantity: 20, Amount: LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue }),
            })
        );
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL])(
        'should refuse a %s payment authorized for credits the user has changed since',
        async (sourceType) => {
            mockPaymentMethods().noSaved();

            render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
            await typeCredits('20');
            await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue));
            const authorizedPayment = {
                Amount: mockFacadeCalls.at(-1).amount,
                Currency: mockFacadeCalls.at(-1).currency,
                PaymentToken: 'payment-token-123',
            };

            await typeCredits('50');
            await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(5000));
            const { onChargeable } = mockFacadeCalls.at(-1);
            await act(async () => {
                await onChargeable({}, { chargeablePaymentParameters: authorizedPayment, sourceType }).catch(() => {});
            });

            expect(buyProductMock).not.toHaveBeenCalled();
        }
    );

    it('should buy the typed credits when account credit leaves several amounts with nothing due', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) => ({
            Currency: data.Currency,
            Amount: data.Quantity * 100,
            AmountDue: 0,
            Credit: data.Quantity * 100,
            TaxInclusive: 1,
            Taxes: [],
        }));

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await waitFor(() => expect(checkProductMock).toHaveBeenCalledTimes(1));
        await typeCredits('25');
        await waitFor(() => expect(checkProductMock).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByTestId('top-up-summary')).toBeInTheDocument());
        const { onChargeable, currency } = mockFacadeCalls.at(-1);
        const chargeablePaymentParameters = { Amount: 0, Currency: currency, PaymentToken: 'payment-token-123' };

        await act(() => onChargeable({}, { chargeablePaymentParameters, sourceType: 'card' }));

        expect(buyProductMock).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ Quantity: 25, Amount: 0 }) })
        );
    });

    it('should top up from account credit without a payment method when it covers the amount due', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) => ({
            Currency: data.Currency,
            Amount: data.Quantity * 100,
            AmountDue: 0,
            Credit: data.Quantity * 100,
            TaxInclusive: 1,
            Taxes: [],
        }));
        const onClose = jest.fn();

        render(
            <ContextLumoCreditsModal
                paymentStatus={MOCK_PAYMENT_STATUS}
                open={true}
                onClose={onClose}
                app={APPS.PROTONLUMO}
            />
        );
        await typeCredits('25');
        await waitFor(() =>
            expect(checkProductMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ Quantity: 25 }) })
            )
        );
        await waitFor(() => expect(screen.getByTestId('top-up-button')).toBeEnabled());

        expect(screen.queryByText('Payment method')).not.toBeInTheDocument();
        expect(screen.getByText('Paid from your account credit.')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('top-up-button'));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        const { data } = buyProductMock.mock.calls.at(-1)[0];
        expect(data).toMatchObject({ ProductType: 'lumo-credit', Quantity: 25, Amount: 0 });
        expect(data.PaymentToken).toBeUndefined();
    });

    it('should keep the payment method when account credit covers only part of the amount due', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) => ({
            Currency: data.Currency,
            Amount: data.Quantity * 100,
            AmountDue: data.Quantity * 100 - 500,
            Credit: 500,
            TaxInclusive: 1,
            Taxes: [],
        }));

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(4500));

        expect(screen.getByText('Payment method')).toBeInTheDocument();
        expect(screen.queryByText('Paid from your account credit.')).not.toBeInTheDocument();
    });

    it('should not apply the minimum to an amount due lowered by account credit', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) => ({
            Currency: data.Currency,
            Amount: data.Quantity * 100,
            AmountDue: data.Quantity * 100 - 1000,
            Credit: 1000,
            TaxInclusive: 1,
            Taxes: [],
        }));

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(1000));

        expect(screen.queryByText(minimumBannerText)).not.toBeInTheDocument();
        expect(screen.getByText('Payment method')).toBeInTheDocument();
    });

    it('should still buy credits in the regular credits modal once the payment is chargeable', async () => {
        mockPaymentMethods().noSaved();
        const onClose = jest.fn();

        render(
            <ContextCreditsModal
                paymentStatus={MOCK_PAYMENT_STATUS}
                open={true}
                onClose={onClose}
                app={APPS.PROTONMAIL}
            />
        );
        await waitFor(() => expect(mockFacadeCalls.length).toBeGreaterThan(0));
        const buyCredit = jest.fn().mockResolvedValue(undefined);
        const { onChargeable, amount, currency } = mockFacadeCalls.at(-1);
        const chargeablePaymentParameters = { Amount: amount, Currency: currency, PaymentToken: 'payment-token-123' };

        await act(() => onChargeable({ buyCredit }, { chargeablePaymentParameters, sourceType: 'card' }));

        expect(buyCredit).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        expect(checkProductMock).not.toHaveBeenCalled();
    });

    it('should not check a product price in the regular credits modal', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />);
        await typeCredits('20');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(2000));
        await screen.findByTestId('amountToCharge-text');

        expect(checkProductMock).not.toHaveBeenCalled();
        expect(screen.queryByTestId('top-up-summary')).not.toBeInTheDocument();
    });

    it('should keep the top-up disabled while the check of the typed credits is pending', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) =>
            data.Quantity === 20 ? createDeferred().promise : getCheckResponse(data)
        );

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');
        await waitFor(() =>
            expect(checkProductMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ Quantity: 20 }) })
            )
        );

        expect(screen.getByTestId('top-up-button')).toBeDisabled();
        expect(screen.queryByTestId('amountToCharge-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('top-up-summary')).not.toBeInTheDocument();
    });

    it('should not offer PayPal before the amount due is known', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) =>
            data.Quantity === 20 ? createDeferred().promise : getCheckResponse(data)
        );

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await waitFor(() => expect(mockFacadeResults.at(-1)?.methods.loading).toBe(false));
        await act(async () => {
            mockFacadeResults.at(-1).methods.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        });
        await typeCredits('20');
        await waitFor(() =>
            expect(checkProductMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ Quantity: 20 }) })
            )
        );

        expect(mockFacadeResults.at(-1).selectedMethodValue).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        expect(screen.getByTestId('top-up-button')).toBeDisabled();
        expect(queryFooterPaypalButton()).not.toBeInTheDocument();
    });

    it('should not offer PayPal below the minimum', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await waitFor(() => expect(mockFacadeResults.at(-1)?.methods.loading).toBe(false));
        await act(async () => {
            mockFacadeResults.at(-1).methods.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        });
        await typeCredits('19');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(1900));

        expect(mockFacadeResults.at(-1).selectedMethodValue).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        expect(screen.getByTestId('top-up-button')).toBeDisabled();
        expect(queryFooterPaypalButton()).not.toBeInTheDocument();
    });

    it('should keep offering PayPal below the minimum in the regular credits modal', async () => {
        mockPaymentMethods().noSaved();

        render(<ContextCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONMAIL} />);
        await waitFor(() => expect(mockFacadeResults.at(-1)?.methods.loading).toBe(false));
        await act(async () => {
            mockFacadeResults.at(-1).methods.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        });
        await typeCredits('4');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(400));

        expect(mockFacadeResults.at(-1).selectedMethodValue).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        expect(queryFooterPaypalButton()).toBeInTheDocument();
        expect(screen.queryByTestId('top-up-button')).not.toBeInTheDocument();
    });

    it('should use the check of the latest credits when an older check resolves last', async () => {
        mockPaymentMethods().noSaved();
        const defaultAmountCheck = createDeferred();
        checkProductMock.mockImplementation(({ data }) =>
            data.Quantity === 50 ? defaultAmountCheck.promise : getCheckResponse(data)
        );

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await waitFor(() => expect(checkProductMock).toHaveBeenCalled());
        await typeCredits('20');
        await waitFor(() => expect(mockFacadeCalls.at(-1).amount).toBe(LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue));

        await act(async () => {
            defaultAmountCheck.resolve(getCheckResponse({ Quantity: 50, Currency: mockFacadeCalls.at(-1).currency }));
        });

        expect(mockFacadeCalls.at(-1).amount).toBe(LUMO_CREDIT_CHECK_TAX_EXCLUSIVE.AmountDue);
        expect(screen.getByTestId('top-up-summary')).toHaveTextContent(/Total\s*21\.62/);
    });

    it('should show an error when the check fails and check again once the credits change', async () => {
        mockPaymentMethods().noSaved();
        checkProductMock.mockImplementation(({ data }) => {
            if (data.Quantity === 20) {
                throw new Error('check failed');
            }
            return getCheckResponse(data);
        });

        render(<ContextLumoCreditsModal paymentStatus={MOCK_PAYMENT_STATUS} open={true} app={APPS.PROTONLUMO} />);
        await typeCredits('20');

        expect(await screen.findByTestId('top-up-check-error')).toBeInTheDocument();
        expect(screen.getByTestId('top-up-button')).toBeDisabled();
        expect(screen.queryByTestId('top-up-summary')).not.toBeInTheDocument();
        expect(screen.queryByTestId('amountToCharge-text')).not.toBeInTheDocument();

        await typeCredits('30');

        await waitFor(() => expect(screen.getByTestId('top-up-summary')).toHaveTextContent(/Total\s*30/));
        expect(screen.queryByTestId('top-up-check-error')).not.toBeInTheDocument();
        expect(screen.getByTestId('top-up-button')).toBeEnabled();
    });
});
