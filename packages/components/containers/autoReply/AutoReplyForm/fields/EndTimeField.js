import React from 'react';
import { Row, Label, Field, TimeSelect } from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';

const EndTimeField = ({ value, onChange }) => {
    return (
        <Row className="flex-spacebetween">
            <Label htmlFor="endTime">{c('Label').t`End time`}</Label>
            <Field>
                <TimeSelect id="endTime" value={value} onChange={onChange} />
            </Field>
        </Row>
    );
};

EndTimeField.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EndTimeField;
