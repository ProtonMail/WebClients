import React from 'react';
import PropTypes from 'prop-types';
import { Row, Label, DateInput, Field } from 'react-components';

const DateField = ({ id, label, value, onChange, min, max }) => {
    return (
        <Row>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <DateInput id={id} className="w100" min={min} max={max} value={value} onChange={onChange} />
            </Field>
        </Row>
    );
};

DateField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.instanceOf(Date).isRequired,
    min: PropTypes.instanceOf(Date),
    max: PropTypes.instanceOf(Date),
    onChange: PropTypes.func.isRequired
};

export default DateField;
