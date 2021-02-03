import React from 'react';
import Icon from '../icon/Icon';
import PrimaryButton from './PrimaryButton';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    icon: string;
    title?: string;
    className?: string;
}
const FloatingButton = ({ icon, title, className, ...rest }: Props) => {
    return (
        <PrimaryButton className={classnames(['fab flex', className])} {...rest}>
            <Icon size={24} className="mauto" name={icon} />
            {title ? <span className="sr-only">{title}</span> : null}
        </PrimaryButton>
    );
};

export default FloatingButton;
