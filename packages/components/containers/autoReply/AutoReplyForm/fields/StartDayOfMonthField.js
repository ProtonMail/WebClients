import React from 'react';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { getDaysOfMonthOptions } from '../../utils';

const StartDayOfMonthField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="startDayOfMonth">{c('Label').t`Start day of month`}</Label>
            <Field>
                <Select id="startDayOfMonth" options={getDaysOfMonthOptions()} value={value} onChange={handleChange} />
            </Field>
        </Row>
    );
};

StartDayOfMonthField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default StartDayOfMonthField;
