import { IcBank } from '@proton/icons/icons/IcBank';
import { IcBrandAmex } from '@proton/icons/icons/IcBrandAmex';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandBitcoin } from '@proton/icons/icons/IcBrandBitcoin';
import { IcBrandDiscover } from '@proton/icons/icons/IcBrandDiscover';
import { IcBrandGoogle } from '@proton/icons/icons/IcBrandGoogle';
import { IcBrandMastercard } from '@proton/icons/icons/IcBrandMastercard';
import { IcBrandPaypal } from '@proton/icons/icons/IcBrandPaypal';
import { IcBrandVisa } from '@proton/icons/icons/IcBrandVisa';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod, SavedPaymentMethod } from '@proton/payments/core/interface';
import { IDEAL_WERO_BRAND_NAME } from '@proton/shared/lib/constants';

import type { MethodsHook } from '../react-extensions/useMethods';
import { wrapMethods } from './useMethods';

const savedCard = (Brand: string): SavedPaymentMethod => ({
    ID: 'saved-1',
    Order: 500,
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    Autopay: Autopay.ENABLE,
    Details: { Brand, Last4: '4242', ExpMonth: '01', ExpYear: '2030', ZIP: '12345', Country: 'US' },
});

const viewOf = (savedMethod: SavedPaymentMethod) => {
    const method: AvailablePaymentMethod = {
        type: savedMethod.Type,
        paymentMethodId: savedMethod.ID,
        value: savedMethod.ID,
        isSaved: true,
        isDefault: false,
    };

    const hook = {
        getSavedMethodByID: () => savedMethod,
        usedMethods: [method],
        newMethods: [],
        allMethods: [method],
        lastUsedMethod: undefined,
    } as unknown as MethodsHook;

    return wrapMethods(hook, 'subscription').usedMethods[0];
};

const newMethodView = (type: PAYMENT_METHOD_TYPES) => {
    const method: AvailablePaymentMethod = { type, value: type, isSaved: false, isDefault: false };

    const hook = {
        getSavedMethodByID: () => undefined,
        usedMethods: [],
        newMethods: [method],
        allMethods: [method],
        lastUsedMethod: undefined,
    } as unknown as MethodsHook;

    return wrapMethods(hook, 'subscription').newMethods[0];
};

describe('saved method icons', () => {
    it.each([
        ['Visa', IcBrandVisa],
        ['MasterCard', IcBrandMastercard],
        ['American Express', IcBrandAmex],
        // the brand is lowercased before lookup, so the table must be keyed in lowercase
        ['Discover', IcBrandDiscover],
    ])('maps card brand %s to its icon', (brand, icon) => {
        expect(viewOf(savedCard(brand)).icon).toBe(icon);
    });

    it('falls back to the generic card icon for an unknown brand', () => {
        expect(viewOf(savedCard('Troy')).icon).toBe(IcCreditCard);
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, IcBrandPaypal],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, IcBank],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, IcBrandApple],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, IcBrandGoogle],
    ])('maps saved %s to its icon', (Type, icon) => {
        const savedMethod = { ...savedCard('Visa'), Type, Details: {} } as unknown as SavedPaymentMethod;
        expect(viewOf(savedMethod).icon).toBe(icon);
    });

    it('leaves iDEAL without an icon, it is overridden by the selector', () => {
        const ideal = {
            ...savedCard('Visa'),
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        } as unknown as SavedPaymentMethod;
        expect(viewOf(ideal).icon).toBeUndefined();
    });
});

describe('saved method labels', () => {
    it('labels a card by brand and last 4', () => {
        expect(viewOf(savedCard('Visa')).text).toBe('Visa ending in 4242');
    });

    it('labels PayPal by payer id', () => {
        const paypal = {
            ...savedCard('Visa'),
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Details: { PayerID: 'payer-1', BillingAgreementID: 'b-1', Payer: 'payer@example.com' },
        } as unknown as SavedPaymentMethod;

        expect(viewOf(paypal).text).toBe('PayPal - payer-1');
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
        'labels %s as a bank transfer',
        (Type) => {
            const method = {
                ...savedCard('Visa'),
                Type,
                Details: { AccountName: 'Jane', Country: 'NL', Last4: '0000' },
            } as unknown as SavedPaymentMethod;

            expect(viewOf(method).text).toBe('Bank transfer - IBAN NL •••• 0000');
        }
    );

    it.each([
        [PAYMENT_METHOD_TYPES.APPLE_PAY, 'Apple Pay - card ending in 4242'],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'Google Pay - card ending in 4242'],
    ])('labels saved %s by last 4', (Type, expected) => {
        const method = { ...savedCard('Visa'), Type } as unknown as SavedPaymentMethod;
        expect(viewOf(method).text).toBe(expected);
    });

    it('returns an empty label for a method type this client does not know', () => {
        const unknown = { ...savedCard('Visa'), Type: 'not-a-real-method' } as unknown as SavedPaymentMethod;
        expect(viewOf(unknown).text).toBe('');
    });
});

describe('new method views', () => {
    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, IcBrandBitcoin, 'Bitcoin'],
        [PAYMENT_METHOD_TYPES.CASH, IcMoneyBills, 'Cash'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, IcCreditCard, 'Credit/debit card'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, IcBrandPaypal, 'PayPal'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, IcBank, 'Bank transfer'],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, IcBrandApple, 'Apple Pay'],
    ])('renders %s', (type, icon, text) => {
        expect(newMethodView(type)).toMatchObject({ icon, text });
    });

    it.each([
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'Google Pay'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, IDEAL_WERO_BRAND_NAME],
    ])('renders %s without an icon', (type, text) => {
        const view = newMethodView(type);
        expect(view.text).toBe(text);
        expect(view.icon).toBeUndefined();
    });

    it('falls back to a new card for an unmapped type', () => {
        expect(newMethodView(PAYMENT_METHOD_TYPES.TOKEN)).toMatchObject({
            icon: IcCreditCard,
            text: 'New credit/debit card',
        });
    });
});
