import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Price } from 'react-components';

import { DEFAULT_CYCLE, DEFAULT_CURRENCY } from 'proton-shared/lib/constants';

const PlanPrice = ({ quantity, amount, cycle, currency, className }) => {
    return (
        <Price className={className} currency={currency} suffix={c('Suffix').t`/ month`}>
            {(quantity * amount) / cycle}
        </Price>
    );
};

PlanPrice.propTypes = {
    quantity: PropTypes.number,
    amount: PropTypes.number,
    cycle: PropTypes.number,
    currency: PropTypes.string,
    className: PropTypes.string
};

PlanPrice.defaultProps = {
    quantity: 1,
    amount: 0,
    cycle: DEFAULT_CYCLE,
    currency: DEFAULT_CURRENCY
};

export default PlanPrice;
