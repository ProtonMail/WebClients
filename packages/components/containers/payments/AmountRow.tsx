import { c } from 'ttag';

import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import type { PaymentMethodStatusExtended, PlainPaymentMethodType } from '@proton/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';
import type { Currency } from '@proton/shared/lib/interfaces';

import PaymentSelector from './PaymentSelector';

interface Props {
    paymentMethodType?: PlainPaymentMethodType;
    amount: number;
    onChangeAmount: (value: number) => void;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    disableCurrencySelector: boolean;
    status: PaymentMethodStatusExtended;
}

const AmountRow = ({
    paymentMethodType,
    amount,
    onChangeAmount,
    currency,
    onChangeCurrency,
    disableCurrencySelector,
    status,
}: Props) => {
    if (paymentMethodType === PAYMENT_METHOD_TYPES.CASH) {
        return null;
    }

    return (
        <Row>
            <span className="label" id="id_desc_amount">{c('Label').t`Amount`}</span>
            <Field>
                <PaymentSelector
                    status={status}
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
