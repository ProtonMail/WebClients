import React from 'react';
import Icon from '../icon/Icon';
import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers';

const PrimaryButton = ({ className = '', icon, ...rest }: ButtonProps) => {
    const buttonIcon = typeof icon === 'string' ? <Icon name={icon} /> : icon;

    return <Button icon={buttonIcon} className={classnames(['button--primary', className])} {...rest} />;
};

export default PrimaryButton;
