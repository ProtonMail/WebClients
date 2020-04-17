import React from 'react';
import PropTypes from 'prop-types';
import { Label, Radio } from 'react-components';

const HumanVerificationLabel = ({ disabled, value, onChange, children, method, methods }) => {
    if (methods.length === 1) {
        return <Label htmlFor={value}>{children}</Label>;
    }

    return (
        <Radio
            className="flex flex-nowrap flex-items-center mb0-5"
            disabled={disabled}
            value={value}
            checked={value === method}
            onChange={() => onChange(value)}
        >
            {children}
        </Radio>
    );
};

HumanVerificationLabel.propTypes = {
    disabled: PropTypes.bool,
    children: PropTypes.node.isRequired,
    methods: PropTypes.oneOf(['captcha', 'sms', 'email', 'invite', 'payment']).isRequired,
    value: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export default HumanVerificationLabel;
