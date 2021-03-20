import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    children: React.ReactNode;
    id?: string;
    className?: string;
}
const ErrorZone = ({ children, id, className }: Props) => {
    return (
        <div className={classnames(['color-danger error-zone', className])} id={id}>
            {children}
        </div>
    );
};

export default ErrorZone;
