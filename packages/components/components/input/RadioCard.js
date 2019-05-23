import React from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'react-components';

const RadioCard = ({ value, checked, label, name, id, children, onChange, disabled, ...rest }) => {
    return (
        <Radio
            className="mr1 bordered-container p1 inbl"
            name={name}
            id={id}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            {...rest}
        >
            <span className="ml0-5">{label}</span>
            <br />
            <br />
            {children}
        </Radio>
    );
};

RadioCard.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    checked: PropTypes.bool,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

export default RadioCard;
