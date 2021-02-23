import React from 'react';
import Icon from '../icon/Icon';
import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

export type PrimaryButtonProps = ButtonProps;

const PrimaryButton = ({ className = '', icon, ...rest }: PrimaryButtonProps) => {
    const buttonIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;

    return <Button icon={buttonIcon} className={classnames(['button--primary', className])} {...rest} />;
};

export default PrimaryButton;
