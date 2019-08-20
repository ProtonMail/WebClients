import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Select } from 'react-components';
import { CYCLE, DEFAULT_CYCLE } from 'proton-shared/lib/constants';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const CycleSelector = ({ cycle = DEFAULT_CYCLE, onSelect, ...rest }) => {
    const handleChange = ({ target }) => onSelect(+target.value);
    const options = [
        { text: c('Billing cycle option').t`Monthly`, value: MONTHLY },
        { text: c('Billing cycle option').t`Annually`, value: YEARLY },
        { text: c('Billing cycle option').t`Two-year`, value: TWO_YEARS }
    ];

    return <Select value={cycle} options={options} onChange={handleChange} {...rest} />;
};

CycleSelector.propTypes = {
    cycle: PropTypes.number,
    onSelect: PropTypes.func.isRequired
};

export default CycleSelector;
