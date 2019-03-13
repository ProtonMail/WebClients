import React from 'react';
import PropTypes from 'prop-types';
import { Label, Radio } from 'react-components';

const RadioCard = ({ value, label, name, id, children, onChange }) => {
    return (
        <Label htmlFor={id} className="mr1 bordered-container p1 inbl">
            <Radio name={name} id={id} value={value} onChange={onChange} />
            {label}
            <br />
            <br />
            {children}
        </Label>
    );
};

RadioCard.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    children: PropTypes.node,
    onChange: PropTypes.func.isRequired
};

export default RadioCard;
