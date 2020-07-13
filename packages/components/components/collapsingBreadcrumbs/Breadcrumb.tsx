import React from 'react';
import { classnames } from '../../helpers/component';

interface Props {
    children: string;
    onClick?: () => void;
    active?: boolean;
}

const Breadcrumb = ({ children, onClick, active }: Props, ref: any) => {
    const textClass = classnames(['pre p0-25 m0 ellipsis', active && 'strong']);
    return (
        <li ref={ref} className={classnames(['pd-collapsing-breadcrumb', active && 'flex-item-fluid-auto'])}>
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
