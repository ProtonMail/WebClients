import { act, renderHook, waitFor } from '@testing-library/react';

import { Autopay, DEFAULT_PAYMENT_VENDOR_STATES, PAYMENT_METHOD_TYPES, PLANS } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod, PaymentStatus, SavedPaymentMethod } from '@proton/payments/core/interface';
import { wait } from '@proton/shared/lib/helpers/promise';
import { buildUser } from '@proton/testing/builders/user';
import { addApiMock, apiMock } from '@proton/testing/lib/api';

import { getStoreWrapper } from '../../containers/contacts/tests/render';
import type { Props } from './useMethods';
import { useMethods } from './useMethods';

let paymentStatus: PaymentStatus;

let paymentMethods: SavedPaymentMethod[];

const cardDetails = {
    Name: 'Arthur Morgan',
    ExpMonth: '12',
    ExpYear: '2030',
    ZIP: '12345',
    Country: 'US',
    Last4: '1234',
    Brand: 'Visa',
};

const savedCard: SavedPaymentMethod = {
    ID: '1',
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    Order: 500,
    Autopay: Autopay.ENABLE,
    Details: cardDetails,
    IsDefault: true,
};

const usedSavedCard: AvailablePaymentMethod = {
    isDefault: true,
    isExpired: false,
    isSaved: true,
    paymentMethodId: '1',
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    value: '1',
};

const newMethod = (type: AvailablePaymentMethod['type']): AvailablePaymentMethod => ({
    isDefault: false,
    isSaved: false,
    type,
    value: type,
});

const defaultProps: Props = {
    amount: 1000,
    currency: 'USD',
    flow: 'credit',
    selectedPlanName: undefined,
    enablePaypalRegionalCurrenciesBatch3: false,
    enablePaypalKrw: false,
    enableIdeal: false,
};

// the wrapper has to be created once per test: a wrapper rebuilt on every render remounts the hook
const renderMethods = (props: Partial<Props> = {}, { isAuthenticated = true } = {}) => {
    const { Wrapper } = getStoreWrapper();

    return renderHook(
        (currentProps: Partial<Props>) =>
            useMethods({ ...defaultProps, ...currentProps }, { api: apiMock, isAuthenticated }),
        { initialProps: props, wrapper: Wrapper }
    );
};

const renderLoadedMethods = async (props: Partial<Props> = {}, options?: { isAuthenticated?: boolean }) => {
    const rendered = renderMethods(props, options);
    await waitFor(() => expect(rendered.result.current.loading).toBe(false));
    return rendered;
};

beforeEach(() => {
    jest.clearAllMocks();

    paymentStatus = {
        CountryCode: 'US',
        State: 'AL',
        VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
    };

    paymentMethods = [savedCard];

    addApiMock('payments/v5/methods', () => ({ PaymentMethods: paymentMethods }));
    addApiMock('payments/v5/status', () => paymentStatus);
});

it('should render', () => {
    const { result } = renderMethods({ paymentStatus, amount: 100 });

    expect(result.current).toBeDefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe(paymentStatus);
    expect(result.current.savedMethods).toBeUndefined();
    expect(result.current.allMethods).toEqual([]);
    expect(result.current.selectedMethod).toBeUndefined();
});

it('should initialize payment methods', async () => {
    const { result } = await renderLoadedMethods({ paymentStatus });

    expect(result.current.status).toEqual(paymentStatus);
    expect(result.current.savedMethods).toEqual(paymentMethods);
    expect(result.current.usedMethods).toEqual([usedSavedCard]);
    expect(result.current.newMethods).toEqual([
        newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
        newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
        newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN),
        newMethod(PAYMENT_METHOD_TYPES.CASH),
    ]);
    expect(result.current.allMethods).toEqual([...result.current.usedMethods, ...result.current.newMethods]);
    expect(result.current.lastUsedMethod).toEqual(usedSavedCard);
    expect(result.current.selectedMethod).toEqual(usedSavedCard);
    expect(result.current.savedSelectedMethod).toEqual(savedCard);
});

describe('fetching', () => {
    it('should not fetch the saved methods when the user is not authenticated', async () => {
        const { result } = await renderLoadedMethods({ paymentStatus }, { isAuthenticated: false });

        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'payments/v5/methods' }));
        expect(result.current.savedMethods).toEqual([]);
    });

    it('should not fetch anything when both the status and the methods are provided', async () => {
        const { result } = await renderLoadedMethods({ paymentStatus, paymentMethods });

        expect(apiMock).not.toHaveBeenCalled();
        expect(result.current.savedMethods).toEqual(paymentMethods);
    });

    it('should resolve the status when it is not provided', async () => {
        const { result } = await renderLoadedMethods();

        expect(result.current.status).toBeDefined();
        expect(result.current.newMethods.length).toBeGreaterThan(0);
    });

    it('should still offer the new methods when the saved ones fail to load', async () => {
        addApiMock('payments/v5/methods', () => {
            throw new Error('nope');
        });

        const { result } = await renderLoadedMethods({ paymentStatus });

        expect(result.current.savedMethods).toEqual([]);
        expect(result.current.usedMethods).toEqual([]);
        expect(result.current.newMethods).toEqual([
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN),
            newMethod(PAYMENT_METHOD_TYPES.CASH),
        ]);
    });

    it('should follow the paymentMethods prop when the caller refreshes it', async () => {
        const { result, rerender } = await renderLoadedMethods({ paymentStatus, paymentMethods: [] });

        expect(result.current.usedMethods).toEqual([]);

        rerender({ paymentStatus, paymentMethods: [savedCard] });

        expect(result.current.savedMethods).toEqual([savedCard]);
        expect(result.current.usedMethods).toEqual([usedSavedCard]);
        expect(result.current.getSavedMethodByID('1')).toEqual(savedCard);
    });

    it('should fetch only once across rerenders', async () => {
        const { result, rerender } = await renderLoadedMethods({ paymentStatus });

        rerender({ paymentStatus, amount: 2000 });
        rerender({ paymentStatus, amount: 3000 });
        await waitFor(() => expect(result.current.loading).toBe(false));

        const methodsCalls = apiMock.mock.calls.filter(([{ url }]: any) => url === 'payments/v5/methods');
        expect(methodsCalls.length).toBe(1);
    });
});

describe('deriving the methods from the props', () => {
    it('should not sort anything while loading', () => {
        const sortNewMethods = jest.fn((methods: AvailablePaymentMethod[]) => methods);

        renderMethods({ sortNewMethods });

        expect(sortNewMethods).not.toHaveBeenCalled();
    });

    it('should update the methods when the amount changes', async () => {
        const { result, rerender } = await renderLoadedMethods({ paymentStatus, amount: 1000 });

        rerender({ paymentStatus, amount: 100 });

        expect(result.current.newMethods).toEqual([
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
            newMethod(PAYMENT_METHOD_TYPES.CASH),
        ]);
    });

    it('should update the methods when the SEPA props change', async () => {
        const sepaProps: Partial<Props> = {
            paymentStatus,
            flow: 'subscription',
            enableSepa: true,
            enableSepaB2C: true,
            billingAddress: { CountryCode: 'US', State: 'AL' },
        };
        const { result, rerender } = await renderLoadedMethods(sepaProps);

        expect(result.current.newMethods).not.toContainEqual(
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        );

        rerender({ ...sepaProps, billingAddress: { CountryCode: 'DE', State: '' } });

        expect(result.current.newMethods).toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT));
    });

    it('should update the methods when the user becomes a Pass Lifetime buyer with credits', async () => {
        const props: Partial<Props> = { paymentStatus, flow: 'subscription' };
        const { result, rerender } = await renderLoadedMethods(props);

        expect(result.current.newMethods).toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN));

        rerender({ ...props, user: buildUser({ Credit: 100 }), planIDs: { [PLANS.PASS_LIFETIME]: 1 } });

        expect(result.current.newMethods).not.toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN));
    });

    it('should offer iDEAL when the enableIdeal flag flips on', async () => {
        paymentStatus = { CountryCode: 'NL', State: null, VendorStates: DEFAULT_PAYMENT_VENDOR_STATES };
        const props: Partial<Props> = {
            paymentStatus,
            currency: 'EUR',
            flow: 'subscription',
            billingAddress: { CountryCode: 'NL' },
        };
        const { result, rerender } = await renderLoadedMethods(props);

        expect(result.current.newMethods).not.toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL));

        rerender({ ...props, enableIdeal: true });

        expect(result.current.newMethods).toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL));
    });

    it('should update the status when the paymentStatus prop changes', async () => {
        const { result, rerender } = await renderLoadedMethods({ paymentStatus });

        const updatedStatus = { ...paymentStatus, VendorStates: { ...paymentStatus.VendorStates, Card: false } };
        rerender({ paymentStatus: updatedStatus });

        expect(result.current.status).toBe(updatedStatus);
        expect(result.current.newMethods).not.toContainEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD));
    });

    it.each([
        ['amount', { amount: 100 }, [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]],
        ['flow', { flow: 'signup' as const }, [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, PAYMENT_METHOD_TYPES.CASH]],
        ['coupon', { coupon: 'ANY_COUPON' }, [PAYMENT_METHOD_TYPES.CASH]],
        ['isTrial', { isTrial: true }, [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, PAYMENT_METHOD_TYPES.CASH]],
    ])('should apply %s even when it changes during a slow initialization', async (_, override, excluded) => {
        addApiMock('payments/v5/methods', async () => {
            await wait(100);
            return { PaymentMethods: paymentMethods };
        });

        const { result, rerender } = renderMethods({ paymentStatus });
        expect(result.current.loading).toBe(true);

        rerender({ paymentStatus, ...override });
        await waitFor(() => expect(result.current.loading).toBe(false));

        const types = result.current.newMethods.map(({ type }) => type);
        excluded.forEach((type) => expect(types).not.toContain(type));
        expect(types).toContain(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    });

    it('should sort only the new methods', async () => {
        const sortNewMethods = jest.fn((methods: AvailablePaymentMethod[]) => [...methods].reverse());
        const { result } = await renderLoadedMethods({ paymentStatus, sortNewMethods });

        expect(sortNewMethods).toHaveBeenCalledWith([
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
            newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN),
            newMethod(PAYMENT_METHOD_TYPES.CASH),
        ]);
        expect(result.current.newMethods[0]).toEqual(newMethod(PAYMENT_METHOD_TYPES.CASH));
        expect(result.current.usedMethods).toEqual([usedSavedCard]);
        expect(result.current.allMethods).toEqual([usedSavedCard, ...result.current.newMethods]);
    });

    it('should return the last saved method as lastUsedMethod', async () => {
        const secondCard = { ...savedCard, ID: '2', IsDefault: false };
        paymentMethods = [savedCard, secondCard];

        const { result } = await renderLoadedMethods({ paymentStatus });

        expect(result.current.usedMethods.map(({ value }) => value)).toEqual(['1', '2']);
        expect(result.current.lastUsedMethod?.value).toBe('2');
    });
});

describe('selection', () => {
    it('should select a method and notify the change only when it differs', async () => {
        const onMethodChanged = jest.fn();
        const { result } = await renderLoadedMethods({ paymentStatus, onMethodChanged });

        expect(result.current.selectedMethod).toEqual(usedSavedCard);
        expect(onMethodChanged).not.toHaveBeenCalled();

        act(() => {
            result.current.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        });
        expect(result.current.selectedMethod).toEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD));
        expect(onMethodChanged).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
        });
        expect(onMethodChanged).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
        });
        expect(result.current.selectedMethod).toEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL));
        expect(onMethodChanged).toHaveBeenCalledTimes(2);
    });

    it('should clear the selection when no id is given, and allow selecting again', async () => {
        const onMethodChanged = jest.fn();
        const { result } = await renderLoadedMethods({ paymentStatus, onMethodChanged });

        act(() => {
            result.current.selectMethod();
        });

        expect(result.current.selectedMethod).toBeUndefined();
        expect(result.current.savedSelectedMethod).toBeUndefined();

        act(() => {
            result.current.selectMethod('1');
        });

        expect(result.current.selectedMethod).toEqual(usedSavedCard);
        expect(onMethodChanged).toHaveBeenCalledWith(usedSavedCard);
    });

    it('should ignore an unknown id', async () => {
        const { result } = await renderLoadedMethods({ paymentStatus });

        act(() => {
            expect(result.current.selectMethod('unknown')).toBeUndefined();
        });

        expect(result.current.selectedMethod).toEqual(usedSavedCard);
    });

    it('should fall back to the first method when the selected one is no longer available', async () => {
        const onMethodChanged = jest.fn();
        const { result, rerender } = await renderLoadedMethods({ paymentStatus, amount: 1000, onMethodChanged });

        act(() => {
            result.current.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN);
        });
        expect(result.current.selectedMethod).toEqual(newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN));

        rerender({ paymentStatus, amount: 100, onMethodChanged });

        expect(result.current.selectedMethod).toEqual(usedSavedCard);
        expect(onMethodChanged).toHaveBeenLastCalledWith(usedSavedCard);
    });

    it('should keep the fallback when the dropped method comes back', async () => {
        const onMethodChanged = jest.fn();
        const { result, rerender } = await renderLoadedMethods({ paymentStatus, amount: 1000, onMethodChanged });

        act(() => {
            result.current.selectMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN);
        });

        rerender({ paymentStatus, amount: 100, onMethodChanged });
        rerender({ paymentStatus, amount: 1000, onMethodChanged });

        expect(result.current.selectedMethod).toEqual(usedSavedCard);
        expect(onMethodChanged).toHaveBeenLastCalledWith(usedSavedCard);
    });

    it('should keep the default selection when a better one becomes available', async () => {
        paymentMethods = [];
        const applePayFirst = (methods: AvailablePaymentMethod[]) =>
            [...methods].sort(
                (a, b) =>
                    Number(b.type === PAYMENT_METHOD_TYPES.APPLE_PAY) -
                    Number(a.type === PAYMENT_METHOD_TYPES.APPLE_PAY)
            );
        const props = { paymentStatus, flow: 'subscription' as const, sortNewMethods: applePayFirst };

        const { result, rerender } = await renderLoadedMethods(props);

        const initialSelection = result.current.selectedMethod;
        expect(initialSelection?.type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);

        rerender({ ...props, canUseApplePay: true });

        expect(result.current.allMethods[0]?.type).toBe(PAYMENT_METHOD_TYPES.APPLE_PAY);
        expect(result.current.selectedMethod).toEqual(initialSelection);
    });

    it.each([PAYMENT_METHOD_TYPES.APPLE_PAY, PAYMENT_METHOD_TYPES.GOOGLE_PAY])(
        'should flag a new %s but not a saved one',
        async (type) => {
            paymentMethods = [{ ...savedCard, ID: 'saved-wallet', Type: type } as SavedPaymentMethod];

            const { result } = await renderLoadedMethods({
                paymentStatus,
                flow: 'subscription',
                canUseApplePay: true,
                canUseGooglePay: true,
            });

            act(() => {
                result.current.selectMethod(type);
            });
            expect(result.current.isNewApplePay).toBe(type === PAYMENT_METHOD_TYPES.APPLE_PAY);
            expect(result.current.isNewGooglePay).toBe(type === PAYMENT_METHOD_TYPES.GOOGLE_PAY);

            act(() => {
                result.current.selectMethod('saved-wallet');
            });
            expect(result.current.isNewApplePay).toBe(false);
            expect(result.current.isNewGooglePay).toBe(false);
        }
    );
});

describe('lookups', () => {
    it('should get a saved method by its ID', async () => {
        const { result } = await renderLoadedMethods({ paymentStatus });

        expect(result.current.getSavedMethodByID('1')).toEqual(savedCard);
        expect(result.current.getSavedMethodByID('unknown')).toBeUndefined();
        expect(result.current.getSavedMethodByID(undefined)).toBeUndefined();
    });

    it('should not resolve saved methods while loading', () => {
        const { result } = renderMethods({ paymentStatus });

        expect(result.current.getSavedMethodByID('1')).toBeUndefined();
    });

    it('should report method types as disabled while loading', async () => {
        const { result } = renderMethods({ paymentStatus });

        expect(result.current.isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(false);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.isMethodTypeEnabled(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(true);
        expect(result.current.isMethodTypeEnabled(PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });
});
