import React from 'react';
import { Row, Label, Field, TimeInput } from 'react-components';
import PropTypes from 'prop-types';

const TimeField = ({ id, label, value, onChange }) => {
    return (
        <Row>
            <Label htmlFor={id}>{label}</Label>
            <Field>
                <TimeInput id={id} value={value} onChange={onChange} />
            </Field>
        </Row>
    );
};

TimeField.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.instanceOf(Date).isRequired,
    min: PropTypes.number,
    max: PropTypes.number,
    onChange: PropTypes.func.isRequired
};

export default TimeField;
