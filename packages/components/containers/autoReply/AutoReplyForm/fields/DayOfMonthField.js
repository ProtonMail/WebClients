import React from 'react';
import { Row, Label, Field, Select } from 'react-components';
import PropTypes from 'prop-types';

import { getDaysOfMonthOptions } from '../../utils';

const DayOfMonthField = ({ id, label, value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <Select id={id} options={getDaysOfMonthOptions()} value={value} onChange={handleChange} />
            </Field>
        </Row>
    );
};

DayOfMonthField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default DayOfMonthField;
