import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';
import { Row, Label, Field } from '../../components';
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
            <Label>{c('Label').t`Amount`}</Label>
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
