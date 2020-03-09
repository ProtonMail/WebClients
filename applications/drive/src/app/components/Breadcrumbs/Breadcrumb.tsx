import React from 'react';
import { classnames } from 'react-components';

interface Props {
    children: string;
    onClick: () => void;
    active?: boolean;
}

const Breadcrumb = React.forwardRef<HTMLLIElement, Props>(({ children, onClick, active }, ref) => {
    return (
        <li ref={ref} className={classnames(['pd-breadcrumb', active && 'pd-breadcrumb--active'])}>
            <button title={children} onClick={onClick} className="pd-breadcrumb-button">
                {children}
            </button>
        </li>
    );
});

export default Breadcrumb;
