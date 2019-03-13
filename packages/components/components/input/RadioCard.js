import React from 'react';
import PropTypes from 'prop-types';
import { Label, Radio } from 'react-components';

const RadioCard = ({ value, checked, label, name, id, children, onChange, disabled }) => {
    return (
        <Label htmlFor={id} className="mr1 bordered-container p1 inbl">
            <Radio name={name} id={id} value={value} checked={checked} onChange={onChange} disabled={disabled} />
            {label}
            <br />
            <br />
            {children}
        </Label>
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
