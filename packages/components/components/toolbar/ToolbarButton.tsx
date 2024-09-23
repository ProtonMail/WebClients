import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cloneElement, forwardRef } from 'react';

import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
    icon?: ReactElement;
    children?: ReactNode;
    title?: ReactNode;
}

const ToolbarButton = (
    { icon, children, className, disabled, tabIndex, title, onClick, ...rest }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const content = (
        <button
            type="button"
            className={clsx([className, 'flex shrink-0 toolbar-button'])}
            onClick={disabled ? noop : onClick}
            tabIndex={disabled ? -1 : tabIndex}
            disabled={disabled}
            ref={ref}
            {...rest}
        >
            {icon &&
                cloneElement(icon, {
                    className: clsx([icon.props.className, 'toolbar-icon m-auto']),
                })}
            {children}
        </button>
    );

    if (title) {
        return <Tooltip title={title}>{content}</Tooltip>;
    }

    return content;
};

export default forwardRef<HTMLButtonElement, Props>(ToolbarButton);
