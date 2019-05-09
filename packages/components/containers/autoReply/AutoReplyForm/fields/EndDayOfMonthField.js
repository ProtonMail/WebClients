import React from 'react';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { getDaysOfMonthOptions } from '../../utils';

const EndDayOfMonthField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="endDayOfMonth">{c('Label').t`End day of month`}</Label>
            <Field>
                <Select id="endDayOfMonth" options={getDaysOfMonthOptions()} value={value} onChange={handleChange} />
            </Field>
        </Row>
    );
};

EndDayOfMonthField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EndDayOfMonthField;
