import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cloneElement, forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
    icon?: ReactElement;
    children?: ReactNode;
    title?: ReactNode;
    loading?: boolean;
}

const ToolbarButton = (
    { icon, children, className, disabled = false, tabIndex, title, onClick, loading = false, ...rest }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const isDisabled = loading || disabled;

    const content = (
        <button
            type="button"
            className={clsx([className, 'flex shrink-0 toolbar-button', loading && 'relative'])}
            onClick={isDisabled ? noop : onClick}
            tabIndex={isDisabled ? -1 : tabIndex}
            disabled={isDisabled}
            aria-busy={loading}
            ref={ref}
            {...rest}
        >
            {icon &&
                cloneElement(icon, {
                    className: clsx([icon.props.className, 'toolbar-icon m-auto', loading && 'opacity-0']),
                })}
            {children}
            {loading && (
                <span className="button-loader-container">
                    <CircleLoader />
                </span>
            )}
        </button>
    );

    if (title) {
        return <Tooltip title={title}>{content}</Tooltip>;
    }

    return content;
};

export default forwardRef<HTMLButtonElement, Props>(ToolbarButton);
