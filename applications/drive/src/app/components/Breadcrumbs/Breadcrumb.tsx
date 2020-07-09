import React from 'react';
import { classnames } from 'react-components';

interface Props {
    children: string;
    onClick: () => void;
    active?: boolean;
}

const Breadcrumb = ({ children, onClick, active }: Props, ref: any) => (
    <li ref={ref} className={classnames(['pd-breadcrumb', active && 'pd-breadcrumb--active'])}>
        <button type="button" title={children} onClick={onClick} className="pd-breadcrumb-button">
            {children}
        </button>
    </li>
);

export default React.forwardRef<HTMLLIElement, Props>(Breadcrumb);
