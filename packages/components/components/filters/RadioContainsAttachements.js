import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Radio, Row } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function RadioContainsAttachements({ comparator, onChange }) {
    const handleChange = ({ target }) => onChange(target.value);

    return (
        <>
            <Row>
                <Radio
                    checked={comparator === 'contains'}
                    onChange={handleChange}
                    name="contains"
                    value="contains"
                    id="contains"
                >
                    {c('Option Filter').t`With Attachments`}
                </Radio>
            </Row>

            <Row>
                <Radio
                    checked={comparator === '!contains'}
                    onChange={handleChange}
                    name="contains"
                    value="!contains"
                    id="notcontains"
                >
                    {c('Option Filter').t`Without Attachments`}
                </Radio>
            </Row>
        </>
    );
}

RadioContainsAttachements.propTypes = {
    comparator: PropTypes.string,
    onChange: PropTypes.func
};

RadioContainsAttachements.defaultProps = {
    onChange: noop
};

export default RadioContainsAttachements;
