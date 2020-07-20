import React, { Ref } from 'react';
import { classnames } from '../../helpers/component';

interface Props extends React.LiHTMLAttributes<HTMLLIElement> {
    children: string;
    onClick?: () => void;
    active?: boolean;
    noShrink?: boolean;
}

const Breadcrumb = ({ children, onClick, active, noShrink, ...rest }: Props, ref: Ref<HTMLLIElement>) => {
    const textClass = classnames(['pre p0-25 m0 ellipsis', active && 'strong']);
    return (
        <li
            {...rest}
            ref={ref}
            className={classnames([
                'pd-collapsing-breadcrumb',
                active && 'flex-item-fluid-auto',
                noShrink && 'pd-collapsing-breadcrumb--noShrink',
            ])}
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
