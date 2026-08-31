import { addApiMock, addApiResolver } from '@proton/testing/lib/api';
import lastItem from '@proton/utils/lastItem';

import { createToken } from '../core/api/api';
import { Autopay, DEFAULT_PAYMENT_VENDOR_STATES, PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../core/constants';
import type { PayPalDetails, PaymentStatus, SavedCardDetails, SavedPaymentMethod } from '../core/interface';

const tokensUrl = createToken({} as any).url;

export const MOCK_TOKEN_RESPONSE = {
    Token: 'token123',
    Code: 1000,
    Status: PAYMENT_TOKEN_STATUS.CHARGEABLE,
};

export function addTokensResponse(response = MOCK_TOKEN_RESPONSE) {
    addApiMock(tokensUrl, () => response);

    const addons = {
        pending: () => {
            addApiMock(tokensUrl, () => ({
                ...response,
                Status: PAYMENT_TOKEN_STATUS.PENDING,
                ApprovalURL: 'https://verify.proton.me',
                ReturnHost: 'https://account.proton.me',
            }));
            return addons;
        },
        throw: () => {
            addApiMock(tokensUrl, () => {
                throw new Error();
            });

            return addons;
        },
    };

    return addons;
}

export function addTokensResolver() {
    return addApiResolver(tokensUrl);
}

export const MOCK_PAYMENT_STATUS: PaymentStatus = {
    CountryCode: 'CH',
    VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
};

export function mockPaymentStatus(status = MOCK_PAYMENT_STATUS) {
    addApiMock(`payments/v4/status`, () => status);
    addApiMock(`payments/v5/status`, () => status);
}

export const PAYMENT_METHODS_MOCK: {
    PaymentMethods: SavedPaymentMethod[];
} = {
    PaymentMethods: [],
};

export function mockPaymentMethods(methods = PAYMENT_METHODS_MOCK) {
    const innerMethods = {
        ...methods,
        PaymentMethods: [...methods.PaymentMethods],
    };

    const applyMock = () => {
        addApiMock('payments/v5/methods', () => innerMethods);
    };

    applyMock();

    const getNextId = (id?: string) => {
        const last = lastItem(innerMethods.PaymentMethods);
        const prevID = last?.ID ?? '0';
        const nextID = id ?? '' + (+prevID + 1);
        return nextID;
    };

    const getNextOrder = (order?: number) => {
        const last = lastItem(innerMethods.PaymentMethods);
        const prevOrder = last?.Order ?? 499;
        const nextOrder = order ?? prevOrder + 1;
        return nextOrder;
    };

    type CommonProps = {
        ID?: string;
        Order?: number;
        autopayStatus?: Autopay;
    };

    const addons = {
        withCard: (card: SavedCardDetails, { ID, Order, autopayStatus }: CommonProps = {}) => {
            innerMethods.PaymentMethods.push({
                ID: getNextId(ID),
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Order: getNextOrder(Order),
                Autopay: autopayStatus ?? Autopay.ENABLE,
                Details: card,
            });

            return addons;
        },
        withPaypal: (paypal: PayPalDetails, { ID, Order }: CommonProps = {}) => {
            innerMethods.PaymentMethods.push({
                ID: getNextId(ID),
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                Order: getNextOrder(Order),
                Details: paypal,
            });

            return addons;
        },
        noSaved: () => {
            innerMethods.PaymentMethods = [];
            return addons;
        },
        reset: () => {
            innerMethods.PaymentMethods = [...methods.PaymentMethods];
            return addons;
        },
    };

    return addons;
}
