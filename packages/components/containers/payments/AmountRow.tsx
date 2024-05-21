import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES, PlainPaymentMethodType } from '@proton/components/payments/core';
import { Currency } from '@proton/shared/lib/interfaces';

import { Field, Row } from '../../components';
import PaymentSelector from './PaymentSelector';

interface Props {
    paymentMethodType?: PlainPaymentMethodType;
    amount: number;
    onChangeAmount: (value: number) => void;
    currency?: Currency;
    onChangeCurrency: (currency: Currency) => void;
    disableCurrencySelector: boolean;
}

const AmountRow = ({
    paymentMethodType,
    amount,
    onChangeAmount,
    currency,
    onChangeCurrency,
    disableCurrencySelector,
}: Props) => {
    if (paymentMethodType === PAYMENT_METHOD_TYPES.CASH) {
        return null;
    }

    return (
        <Row>
            <span className="label" id="id_desc_amount">{c('Label').t`Amount`}</span>
            <Field>
                <PaymentSelector
                    amount={amount}
                    onChangeAmount={onChangeAmount}
                    currency={currency}
                    onChangeCurrency={onChangeCurrency}
                    disableCurrencySelector={disableCurrencySelector}
                />
            </Field>
        </Row>
    );
};

export default AmountRow;
