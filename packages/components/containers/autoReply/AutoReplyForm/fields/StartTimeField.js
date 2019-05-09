import React from 'react';
import { Row, Label, Field, TimeSelect } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';

const StartTimeField = ({ value, onChange }) => {
    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="startTime">{c('Label').t`Start time`}</Label>
            <Field>
                <TimeSelect id="startTime" value={value} onChange={onChange} />
            </Field>
        </Row>
    );
};

StartTimeField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default StartTimeField;
