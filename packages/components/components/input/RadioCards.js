import React from 'react';
import PropTypes from 'prop-types';
import { RadioCard, Block } from 'react-components';

const RadioCards = ({ list = [], id, ...rest }) => {
    return (
        <Block id={id} className="flex" {...rest}>
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
        </Block>
    );
};

RadioCards.propTypes = {
    list: PropTypes.array.isRequired,
    id: PropTypes.string
};

export default RadioCards;
