import React from 'react';
import { classnames } from '../../helpers/component';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

const Toolbar = ({ children, className, ...rest }: Props) => (
    <div className={classnames(['toolbar flex flex-nowrap no-scroll noprint', className])} {...rest}>
        {children}
    </div>
);

export default Toolbar;
