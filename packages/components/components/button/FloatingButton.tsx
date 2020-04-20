import React from 'react';
import Icon from '../icon/Icon';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    icon: string;
    title?: string;
}
const FloatingButton = ({ icon, title, ...rest }: Props) => {
    return (
        <button type="button" className="compose-fab pm-button--primary flex" {...rest}>
            <Icon size={24} className="mauto" name={icon} />
            {title ? <span className="sr-only">{title}</span> : null}
        </button>
    );
};

export default FloatingButton;
