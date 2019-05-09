import React from 'react';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { getWeekdayOptions } from '../../utils';

const StartDayOfWeekField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="startDayOfWeek">{c('Label').t`Start weekday`}</Label>
            <Field>
                <Select id="startDayOfWeek" options={getWeekdayOptions()} onChange={handleChange} value={value} />
            </Field>
        </Row>
    );
};

StartDayOfWeekField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default StartDayOfWeekField;
