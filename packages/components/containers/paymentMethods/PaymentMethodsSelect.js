import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import usePaymentMethodsSelect from '../payments/usePaymentMethodsSelect';
import { CYCLE } from 'proton-shared/lib/constants';

const PaymentMethodsSelect = ({ method, amount, cycle, coupon, type, onChange }) => {
    const { methods, loading } = usePaymentMethodsSelect({ amount, cycle, coupon, type });
    const handleChange = ({ target }) => onChange(target.value);

    useEffect(() => {
        onChange(methods[0].value); // Select first payment method after all methods are loaded
    }, [methods.length]);

    return <Select disabled={loading} value={method} options={methods} onChange={handleChange} />;
};

PaymentMethodsSelect.propTypes = {
    method: PropTypes.string,
    amount: PropTypes.number.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEAR]),
    coupon: PropTypes.string,
    type: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export default PaymentMethodsSelect;
