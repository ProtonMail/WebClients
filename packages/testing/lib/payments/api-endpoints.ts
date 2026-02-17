import { createTokenV4 } from '@proton/payments/core/api/api';
import { Autopay, PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type {
    PayPalDetails,
    PaymentStatus,
    SavedCardDetails,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import lastItem from '@proton/utils/lastItem';

import { addApiMock, addApiResolver } from '../api';

const tokensUrl = createTokenV4({} as any).url;

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
    VendorStates: {
        Card: true,
        Paypal: true,
        Apple: true,
        Cash: true,
        Bitcoin: true,
        Google: true,
    },
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
                Type: PAYMENT_METHOD_TYPES.CARD,
                Order: getNextOrder(Order),
                Autopay: autopayStatus ?? Autopay.ENABLE,
                Details: card,
            });

            return addons;
        },
        withPaypal: (paypal: PayPalDetails, { ID, Order }: CommonProps = {}) => {
            innerMethods.PaymentMethods.push({
                ID: getNextId(ID),
                Type: PAYMENT_METHOD_TYPES.PAYPAL,
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
