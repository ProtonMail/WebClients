import React from 'react';

import RadioCard, { RadioCardProps } from './RadioCard';

interface Props {
    list: RadioCardProps[];
    id: string;
    describedByID: string;
}

const RadioCards = ({ list = [], id, describedByID, ...rest }: Props) => {
    return (
        <div id={id} className="mb1 flex" {...rest}>
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
                        aria-describedby={describedByID}
                    >
                        {children}
                    </RadioCard>
                );
            })}
        </div>
    );
};

export default RadioCards;
