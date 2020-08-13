import React from 'react';
import { classnames } from '../../helpers';

interface Props {
    children: React.ReactNode;
    className?: string;
    caption?: string;
}

const Table = ({ children, className, caption }: Props) => {
    return (
        <table className={classnames(['pm-simple-table', className])}>
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            {children}
        </table>
    );
};

export default Table;
