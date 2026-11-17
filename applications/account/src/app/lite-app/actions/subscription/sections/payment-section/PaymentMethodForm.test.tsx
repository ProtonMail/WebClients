import { useEffect } from 'react';

import { act, render, screen } from '@testing-library/react';

import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentMethodType, SavedPaymentMethod } from '@proton/payments/core/interface';

import PaymentMethodForm from './PaymentMethodForm';

const mockUser = { Billed: false };
let mockUID: string | undefined = 'uid';

jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [mockUser] }));
jest.mock('@proton/components/hooks/useAuthentication', () => ({
    __esModule: true,
    default: () => ({ UID: mockUID }),
}));
jest.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: jest.fn() }));
jest.mock('@proton/payments-ui/ui/billing-address/components/TaxFields', () => ({
    TaxFields: () => <div data-testid="tax-fields" />,
}));
jest.mock('@proton/payments-ui/ui/components/ChargebeeWrapper', () => ({
    ChargebeeCreditCardWrapper: ({ suffix, showCountry }: { suffix: React.ReactNode; showCountry: boolean }) => (
        <div data-testid="card-form" data-show-country={showCountry}>
            {suffix}
        </div>
    ),
    ChargebeeSavedCardWrapper: () => <div data-testid="saved-card-3ds" />,
}));
jest.mock('@proton/payments-ui/ui/components/SepaDirectDebit', () => ({
    SepaDirectDebit: () => <div data-testid="sepa-form" />,
}));
jest.mock('@proton/payments-ui/ui/components/IdealAccountHolderInput', () => ({
    IdealAccountHolderInput: () => <div data-testid="ideal-form" />,
}));
jest.mock('@proton/payments-ui/payment-methods/bitcoin/BitcoinView', () => ({
    BitcoinView: ({ loading }: { loading: boolean }) => <div data-testid="bitcoin-view" data-loading={loading} />,
}));
jest.mock('@proton/payments-hooks/payment-methods/bitcoin/BitcoinInfoMessage', () => ({
    BitcoinInfoMessage: () => <div data-testid="bitcoin-info-message" />,
}));
jest.mock('@proton/payments-hooks/client-extensions/billed-user/BilledUserInlineMessage', () => ({
    BilledUserInlineMessage: () => <div data-testid="billed-user-message" />,
}));
jest.mock('@proton/payments-hooks/payment-methods/paypal/PayPalInfoMessage', () => ({
    PayPalInfoMessage: () => <div data-testid="paypal-info-message" />,
}));
jest.mock('@proton/components/containers/payments/DefaultPaymentMethodMessage', () => ({
    __esModule: true,
    default: () => <div data-testid="default-payment-method-message" />,
}));
jest.mock('@proton/components/containers/payments/subscription/modal-components/NoPaymentRequiredNote', () => ({
    NoPaymentRequiredNote: () => <div data-testid="no-payment-required" />,
}));

const savedCard = {
    ID: 'saved-card',
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    Order: 1,
    Details: { Brand: 'Visa', Last4: '4242', ExpMonth: '01', ExpYear: '2030', Country: 'DE', ZIP: '10115' },
} as SavedPaymentMethod;

const savedPaypal = {
    ID: 'saved-paypal',
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
    Order: 2,
    Details: { BillingAgreementID: 'B-1', PayerID: 'P-1', Payer: 'ada@example.com' },
} as SavedPaymentMethod;

const savedSepa = {
    ID: 'saved-sepa',
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
    Order: 3,
    Details: { AccountName: 'Ada Lovelace', Country: 'DE', Last4: '3000' },
} as SavedPaymentMethod;

const savedGooglePay = {
    ID: 'saved-google-pay',
    Type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    Order: 4,
    Details: { Brand: 'Visa', Last4: '1111', ExpMonth: '01', ExpYear: '2030', Country: 'DE', ZIP: '10115' },
} as SavedPaymentMethod;

let mockChildrenMounts = 0;
const Children = () => {
    useEffect(() => {
        mockChildrenMounts++;
    }, []);
    return <div data-testid="children" />;
};

const form = ({
    selectedMethodValue,
    savedSelectedMethod,
    paymentMethodRequired = true,
    flow = 'subscription',
    discount = -300,
    taxCountry,
}: {
    selectedMethodValue: PaymentMethodType | undefined;
    savedSelectedMethod?: SavedPaymentMethod;
    paymentMethodRequired?: boolean;
    flow?: string;
    discount?: number;
    taxCountry?: { billingAddressValid: boolean };
}) => {
    jest.mocked(usePayments).mockReturnValue({
        checkoutUi: { couponDiscount: discount, discountPerCycle: 0, checkResult: { AmountDue: 1200 } },
        subscription: undefined,
    } as unknown as ReturnType<typeof usePayments>);

    const paymentFacade = {
        selectedMethodValue,
        iframeHandles: {},
        chargebeeCard: {},
        chargebeePaypal: {},
        chargebeeIdeal: {},
        directDebit: {},
        themeCode: 0,
        showTaxCountry: true,
        bitcoinChargebee: { loading: false },
        amount: 1200,
        currency: 'EUR',
        methods: { savedSelectedMethod, savedMethods: [savedCard] },
        flow,
    } as any;

    return (
        <PaymentMethodForm
            paymentFacade={paymentFacade}
            paymentMethodRequired={paymentMethodRequired}
            vatNumber={undefined}
            taxCountry={taxCountry as any}
        >
            <Children />
        </PaymentMethodForm>
    );
};

const renderForm = (options: Parameters<typeof form>[0]) => render(form(options));

const startsWithText = (element: Element, text: string) =>
    element.firstChild?.nodeType === Node.TEXT_NODE && element.firstChild.textContent?.startsWith(text);

const layout = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('*')).flatMap((element) => {
        if (element.hasAttribute('data-testid')) {
            return [element.getAttribute('data-testid')];
        }
        if (startsWithText(element, 'You saved')) {
            return ['discount'];
        }
        if (startsWithText(element, 'Total:')) {
            return ['total'];
        }
        return [];
    });

beforeEach(() => {
    mockUser.Billed = false;
    mockUID = 'uid';
});

afterEach(() => {
    jest.useRealTimers();
});

describe('lite PaymentMethodForm new methods', () => {
    it.each([
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            ['card-form', 'tax-fields', 'discount', 'children', '3ds-info', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            ['tax-fields', 'paypal-info-message', 'discount', 'total', 'children', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.APPLE_PAY,
            ['tax-fields', 'discount', 'total', 'children', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.GOOGLE_PAY,
            ['tax-fields', 'discount', 'total', 'children', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            ['discount', 'total', 'sepa-form', 'tax-fields', 'children', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
            ['ideal-form', 'tax-fields', 'discount', 'total', 'children', 'default-payment-method-message'],
        ],
        [
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            [
                'bitcoin-info-message',
                'bitcoin-view',
                'tax-fields',
                'discount',
                'total',
                'children',
                'default-payment-method-message',
            ],
        ],
        [PAYMENT_METHOD_TYPES.CASH, ['default-payment-method-message']],
        [PAYMENT_METHOD_TYPES.TOKEN, ['default-payment-method-message']],
    ])('renders %s', (selectedMethodValue, expected) => {
        const { container } = renderForm({ selectedMethodValue });

        expect(layout(container)).toEqual(expected);
    });

    it('asks the card form for the country when the tax country is not shown', () => {
        renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD });

        expect(screen.getByTestId('card-form')).toHaveAttribute('data-show-country', 'false');
    });

    it.each([
        [undefined, 'false'],
        [{ billingAddressValid: true }, 'false'],
        [{ billingAddressValid: false }, 'true'],
    ])('passes the bitcoin loading state for tax country %p', (taxCountry, loading) => {
        jest.useFakeTimers();
        renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, taxCountry });
        act(() => jest.advanceTimersByTime(300));

        expect(screen.getByTestId('bitcoin-view')).toHaveAttribute('data-loading', loading);
    });

    it('renders the billed-user message instead of the bitcoin form for a billed user', () => {
        mockUser.Billed = true;
        const { container } = renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN });

        expect(layout(container)).toEqual(['billed-user-message', 'children', 'default-payment-method-message']);
    });

    it.each([false, true])('renders no bitcoin form without a session (billed: %s)', (billed) => {
        mockUser.Billed = billed;
        mockUID = undefined;
        const { container } = renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN });

        expect(layout(container)).toEqual(['default-payment-method-message']);
    });

    it('omits the default payment method message outside the subscription flow', () => {
        const { container } = renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY, flow: 'credit' });

        expect(layout(container)).toEqual(['tax-fields', 'discount', 'total', 'children']);
    });

    it('omits the discount badge without a discount', () => {
        const { container } = renderForm({ selectedMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY, discount: 0 });

        expect(layout(container)).toEqual(['tax-fields', 'total', 'children', 'default-payment-method-message']);
    });

    it.each([
        [PAYMENT_METHOD_TYPES.APPLE_PAY, PAYMENT_METHOD_TYPES.GOOGLE_PAY, 2],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 2],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, PAYMENT_METHOD_TYPES.GOOGLE_PAY, 1],
    ])('switching from %s to %s mounts the children %i time(s)', (from, to, mounts) => {
        mockChildrenMounts = 0;
        const { rerender } = renderForm({ selectedMethodValue: from });
        rerender(form({ selectedMethodValue: to }));

        expect(mockChildrenMounts).toBe(mounts);
    });
});

describe('lite PaymentMethodForm saved methods', () => {
    it.each([
        [
            savedCard.Type,
            savedCard,
            ['existing-credit-card', 'tax-fields', 'discount', 'children', '3ds-info', 'saved-card-3ds'],
        ],
        [savedPaypal.Type, savedPaypal, ['existing-paypal', 'tax-fields', 'discount', 'total', 'children']],
        [savedGooglePay.Type, savedGooglePay, ['tax-fields', 'discount', 'total', 'children', 'saved-card-3ds']],
        [savedSepa.Type, savedSepa, ['existing-sepa', 'tax-fields', 'discount', 'total', 'children']],
    ])('renders saved %s', (_type, savedMethod, expected) => {
        const { container } = renderForm({
            selectedMethodValue: savedMethod.ID,
            savedSelectedMethod: savedMethod,
            flow: 'credit',
        });

        expect(layout(container)).toEqual(expected);
    });

    it('shows the SEPA mandate text for a saved SEPA method', () => {
        renderForm({ selectedMethodValue: savedSepa.ID, savedSelectedMethod: savedSepa });

        expect(screen.getByText(/you authorize Proton and Stripe/)).toBeVisible();
    });
});

describe('lite PaymentMethodForm without a required payment method', () => {
    it.each([
        [false, PAYMENT_METHOD_TYPES.CHARGEBEE_CARD],
        [true, undefined],
    ])('renders the no-payment note (required: %s, method: %s)', (paymentMethodRequired, selectedMethodValue) => {
        const { container } = renderForm({ selectedMethodValue, paymentMethodRequired });

        expect(layout(container)).toEqual(['no-payment-required', 'children']);
    });
});
