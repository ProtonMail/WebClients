import React from 'react';
import Radio from './Radio';

interface Props {
    id: string;
    name: string;
    label: string;
    checked: boolean;
    onChange: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
}

const RadioCard = ({ label, name, id, checked, children, onChange, ...rest }: Props) => {
    return (
        <Radio
            className="mr1 mb1 bordered-container p1 inline-block"
            name={name}
            id={id}
            onChange={onChange}
            checked={checked}
            {...rest}
        >
            <span className="ml0-5">{label}</span>
            <br />
            <br />
            {children}
        </Radio>
    );
};

export default RadioCard;
