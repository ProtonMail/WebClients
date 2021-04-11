import React from 'react';
import Radio from './Radio';

export interface RadioCardProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    name: string;
    label: string;
    checked: boolean;
    onChange: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
}

const RadioCard = ({ label, name, id, checked, children, onChange, ...rest }: RadioCardProps) => {
    return (
        <Radio
            className="mr1 mb1 bordered p1 inline-block"
            name={name}
            id={id}
            onChange={onChange}
            checked={checked}
            {...rest}
        >
            <span className="ml0-5">{label}</span>
            <div className="mt1">{children}</div>
        </Radio>
    );
};

export default RadioCard;
