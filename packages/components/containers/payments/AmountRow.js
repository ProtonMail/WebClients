import React from 'react';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Row, Label, Field } from '../../components';
import PaymentSelector from './PaymentSelector';

const AmountRow = ({ method, amount, onChangeAmount, currency, onChangeCurrency }) => {
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

AmountRow.propTypes = {
    method: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    onChangeAmount: PropTypes.func.isRequired,
    currency: PropTypes.string.isRequired,
    onChangeCurrency: PropTypes.func.isRequired,
};

export default AmountRow;
