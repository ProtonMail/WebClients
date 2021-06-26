import React, { Ref } from 'react';
import { classnames } from '../../helpers';

interface Props extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
    children: string;
    active?: boolean;
    noShrink?: boolean;
    onClick?: () => void;
}

const Breadcrumb = ({ children, onClick, active, noShrink, className, ...rest }: Props, ref: Ref<HTMLLIElement>) => {
    const textClass = classnames([
        'text-pre p0-25 m0 text-ellipsis no-pointer-events-children',
        active && 'text-strong',
    ]);
    return (
        <li
            {...rest}
            ref={ref}
            className={classnames(['collapsing-breadcrumb', noShrink && 'collapsing-breadcrumb--no-shrink', className])}
        >
            {onClick ? (
                <button type="button" title={children} onClick={onClick} className={textClass}>
                    {children}
                </button>
            ) : (
                <span title={children} className={textClass}>
                    {children}
                </span>
            )}
        </li>
    );
};

export default React.forwardRef<HTMLLIElement, Props>(Breadcrumb);
