import React from 'react';
import { Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { getWeekdayOptions } from '../../utils';

const EndDayOfWeekField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="endDayOfWeek">{c('Label').t`End weekday`}</Label>
            <Field>
                <Select id="endDayOfWeek" options={getWeekdayOptions()} onChange={handleChange} value={value} />
            </Field>
        </Row>
    );
};

EndDayOfWeekField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EndDayOfWeekField;
