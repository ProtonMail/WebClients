import React from 'react';
import PropTypes from 'prop-types';
import { Row, Label, Field, PaymentSelector } from 'react-components';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const AmountRow = ({ method, type, amount, onChangeAmount, currency, onChangeCurrency }) => {
    if ((method === PAYMENT_METHOD_TYPES.BITCOIN && type === 'donation') || method === PAYMENT_METHOD_TYPES.CASH) {
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
    type: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    onChangeAmount: PropTypes.func.isRequired,
    currency: PropTypes.string.isRequired,
    onChangeCurrency: PropTypes.func.isRequired
};

export default AmountRow;
