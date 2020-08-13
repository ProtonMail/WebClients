import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { getDurationOptions } from '../../utils';
import { Select, Label, Row, Field } from '../../../../components';

const DurationField = ({ value, onChange }) => {
    const handleChange = ({ target }) => onChange(+target.value);

    return (
        <Row>
            <Label htmlFor="duration">{c('Label').t`Duration`}</Label>
            <Field>
                <Select id="duration" value={value} onChange={handleChange} options={getDurationOptions()} />
            </Field>
        </Row>
    );
};

DurationField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default DurationField;
