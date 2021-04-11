import React from 'react';

import RadioCard, { RadioCardProps } from './RadioCard';

interface Props {
    list: RadioCardProps[];
    id: string;
}

const RadioCards = ({ list = [], id, ...rest }: Props) => {
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
                    >
                        {children}
                    </RadioCard>
                );
            })}
        </div>
    );
};

export default RadioCards;
