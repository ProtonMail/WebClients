import { c } from 'ttag';

import Field from '@proton/components/components/container/Field';
import Label from '@proton/components/components/label/Label';
import type { Currency, PaymentStatus, PlainPaymentMethodType } from '@proton/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';

import PaymentSelector from './PaymentSelector';

interface Props {
    paymentMethodType?: PlainPaymentMethodType;
    amount: number;
    onChangeAmount: (value: number) => void;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    disableCurrencySelector: boolean;
    paymentStatus: PaymentStatus;
}

const AmountRow = ({
    paymentMethodType,
    amount,
    onChangeAmount,
    currency,
    onChangeCurrency,
    disableCurrencySelector,
    paymentStatus,
}: Props) => {
    if (paymentMethodType === PAYMENT_METHOD_TYPES.CASH) {
        return null;
    }

    return (
        <div className="my-4">
            <Label className="mb-2 block text-bold" id="id_desc_amount">{c('Label').t`Amount`}</Label>
            <Field>
                <PaymentSelector
                    paymentStatus={paymentStatus}
                    amount={amount}
                    onChangeAmount={onChangeAmount}
                    currency={currency}
                    onChangeCurrency={onChangeCurrency}
                    disableCurrencySelector={disableCurrencySelector}
                />
            </Field>
        </div>
    );
};

export default AmountRow;
