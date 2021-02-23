import React from 'react';
import Icon from '../icon/Icon';
import PrimaryButton, { PrimaryButtonProps } from './PrimaryButton';
import { classnames } from '../../helpers';

interface Props extends PrimaryButtonProps {
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
