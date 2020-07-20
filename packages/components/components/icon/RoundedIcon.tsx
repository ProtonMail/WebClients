import React from 'react';

import Icon from './Icon';
import { classnames } from '../../helpers/component';

const TYPES = {
    success: 'bg-global-success',
    warning: 'bg-global-attention',
    error: 'bg-global-warning',
};

interface Props {
    iconClassName?: string;
    className?: string;
    type?: 'success' | 'warning' | 'error';
    title?: string;
    padding?: string;
    name: string;
}

const RoundedIcon = ({
    className = '',
    iconClassName = 'color-white',
    type = 'success',
    padding = 'p0-5',
    title,
    name,
    ...rest
}: Props) => {
    return (
        <span
            className={classnames([
                'inline-flex rounded50 flex-item-noshrink',
                className,
                padding,
                type && TYPES[type],
            ])}
            title={title}
        >
            <Icon size={12} className={iconClassName} name={name} {...rest} />
        </span>
    );
};

export default RoundedIcon;
