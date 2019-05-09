import React from 'react';
import PropTypes from 'prop-types';
import { Row, Label, DateInput, Field } from 'react-components';
import { c } from 'ttag';
import moment from 'moment';

const EndDateField = ({ value, onChange }) => {
    const handleChange = (date) => onChange(new Date(date).getTime());

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="endDate">{c('Label').t`End date`}</Label>
            <Field>
                <DateInput
                    id="endDate"
                    className="w100"
                    defaultDate={new Date(value)}
                    setDefaultDate
                    onSelect={handleChange}
                    format={moment.localeData().longDateFormat('L')}
                />
            </Field>
        </Row>
    );
};

EndDateField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EndDateField;
