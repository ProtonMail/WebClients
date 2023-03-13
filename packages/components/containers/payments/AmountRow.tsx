import { c } from 'ttag';

import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { Field, Row } from '../../components';
import PaymentSelector from './PaymentSelector';

interface Props {
    method?: PAYMENT_METHOD_TYPE;
    amount: number;
    onChangeAmount: (value: number) => void;
    currency?: Currency;
    onChangeCurrency: (currency: Currency) => void;
}

const AmountRow = ({ method, amount, onChangeAmount, currency, onChangeCurrency }: Props) => {
    if (method === PAYMENT_METHOD_TYPES.CASH) {
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
                />
            </Field>
        </Row>
    );
};

export default AmountRow;
