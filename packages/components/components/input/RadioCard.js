import React from 'react';
import PropTypes from 'prop-types';
import { Bordered, Radio } from 'react-components';

const RadioCard = ({ value, checked, label, name, id, children, onChange, disabled, ...rest }) => {
    return (
        <Bordered htmlFor={id} className="mr1">
            <Radio
                name={name}
                id={id}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                {...rest}
            />
            {label}
            <br />
            <br />
            {children}
        </Bordered>
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
