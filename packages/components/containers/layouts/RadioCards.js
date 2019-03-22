import React from 'react';
import PropTypes from 'prop-types';
import { RadioCard } from 'react-components';

const RadioCards = ({ list = [] }) => {
    return (
        <>
            {list.map(({ value, checked, label, name, id, children, onChange, disabled }, index) => {
                return (
                    <RadioCard
                        key={index.toString()}
                        value={value}
                        checked={checked}
                        label={label}
                        name={name}
                        id={id}
                        onChange={onChange}
                        disabled={disabled}
                    >
                        {children}
                    </RadioCard>
                );
            })}
        </>
    );
};

RadioCards.propTypes = {
    list: PropTypes.array.isRequired
};

export default RadioCards;
