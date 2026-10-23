import { render, screen } from '@testing-library/react';

import { IDEAL_WERO_BRAND_NAME } from '@proton/chargebee/lib/constants';
import type { ViewPaymentMethod } from '@proton/payments-ui/client-extensions/useMethods';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';

import PaymentMethodSelector from './PaymentMethodSelector';

const newMethod = (type: PAYMENT_METHOD_TYPES, text: string): ViewPaymentMethod => ({
    type,
    value: type,
    text,
    isSaved: false,
    isDefault: false,
});

it('renders the Google Pay and iDEAL option marks', () => {
    render(
        <PaymentMethodSelector
            options={[
                newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'Credit/debit card'),
                newMethod(PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'Google Pay'),
                newMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, IDEAL_WERO_BRAND_NAME),
            ]}
            onChange={jest.fn()}
        />
    );

    expect(screen.getByAltText('Google Pay mark')).toBeInTheDocument();
    expect(screen.getByAltText(`${IDEAL_WERO_BRAND_NAME} mark`)).toBeInTheDocument();
});
