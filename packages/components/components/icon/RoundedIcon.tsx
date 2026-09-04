import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { IconComponent } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

const TYPES = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-danger',
};

interface Props {
    className?: string;
    type?: 'success' | 'warning' | 'error';
    title?: string;
    padding?: string;
    /** The badge fixes the icon size, so it takes the component rather than an element. */
    icon: IconComponent;
}

const RoundedIcon = (
    { className = '', type = 'success', padding = 'p-2', title, icon: Icon, ...rest }: Props,
    ref: Ref<HTMLSpanElement>
) => {
    return (
        <span
            className={clsx(['inline-flex rounded-50 shrink-0', className, padding, type && TYPES[type]])}
            title={title}
            ref={ref}
        >
            <Icon size={3} {...rest} />
        </span>
    );
};

export default forwardRef<HTMLSpanElement, Props>(RoundedIcon);
