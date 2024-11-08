import { render, screen } from '@testing-library/react';

import { type AvailablePaymentMethod, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { buildUser } from '@proton/testing/builders';

import { type MethodsHook } from '../../payments/react-extensions';
import Checkout, { type Props } from './Checkout';

let props: Props;
beforeEach(() => {
    props = {
        currencies: [],
        currency: 'EUR',
        onChangeCurrency: jest.fn(),
        children: <div>children</div>,
        renewNotice: <div>renewNotice</div>,
        user: buildUser(),
        planIDs: {},
        paymentMethods: {
            selectedMethod: undefined,
            allMethods: [],
            loading: false,
            usedMethods: [],
            newMethods: [],
            lastUsedMethod: undefined,
            savedInternalSelectedMethod: undefined,
            savedExternalSelectedMethod: undefined,
            savedSelectedMethod: undefined,
            selectMethod: jest.fn(),
            getSavedMethodByID: jest.fn(),
            status: undefined,
            savedMethods: undefined,
            isNewPaypal: false,
            isMethodTypeEnabled: jest.fn(),
        } as MethodsHook,
    };
});

it('should render', () => {
    render(<Checkout {...props} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
});

it('should disable currency selector when loading', () => {
    render(<Checkout {...props} loading={true} />);

    expect(screen.getByTestId('currency-selector')).toBeDisabled();
});

it('should disable currency selector when selected method is SEPA', () => {
    props.paymentMethods.selectedMethod = {
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        value: 'SEPA',
        isSaved: false,
    } as AvailablePaymentMethod;

    render(<Checkout {...props} />);

    expect(screen.getByTestId('currency-selector')).toBeDisabled();
});
