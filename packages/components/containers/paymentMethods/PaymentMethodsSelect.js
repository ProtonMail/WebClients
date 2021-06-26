import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Select } from '../../components';

const PaymentMethodsSelect = ({ method, methods = [], onChange, loading }) => {
    const handleChange = ({ target }) => onChange(target.value);

    useEffect(() => {
        // Select first payment method after all methods are loaded
        if (methods.length) {
            onChange(methods[0].value);
        }
    }, [methods[0].value]);

    return <Select loading={loading} value={method} options={methods} onChange={handleChange} />;
};

PaymentMethodsSelect.propTypes = {
    method: PropTypes.string,
    methods: PropTypes.array,
    loading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default PaymentMethodsSelect;
