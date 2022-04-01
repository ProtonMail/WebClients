import { forwardRef, Ref } from 'react';
import Icon, { IconName } from './Icon';
import { classnames } from '../../helpers';

const TYPES = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-danger',
};

interface Props {
    iconClassName?: string;
    className?: string;
    type?: 'success' | 'warning' | 'error';
    title?: string;
    padding?: string;
    name: IconName;
}

const RoundedIcon = (
    { className = '', iconClassName, type = 'success', padding = 'p0-5', title, name, ...rest }: Props,
    ref: Ref<HTMLSpanElement>
) => {
    return (
        <span
            className={classnames([
                'inline-flex rounded-50 flex-item-noshrink',
                className,
                padding,
                type && TYPES[type],
            ])}
            title={title}
            ref={ref}
        >
            <Icon size={12} className={iconClassName} name={name} {...rest} />
        </span>
    );
};

export default forwardRef<HTMLSpanElement, Props>(RoundedIcon);
