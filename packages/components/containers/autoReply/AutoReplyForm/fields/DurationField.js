import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Select, Label, Row, Field } from 'react-components';
import { getDurationOptions } from '../../utils';

const DurationField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="duration">{c('Label').t`Duration`}</Label>
            <Field>
                <Select id="duration" value={value} onChange={handleChange} options={getDurationOptions()} />
            </Field>
        </Row>
    );
};

DurationField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default DurationField;
