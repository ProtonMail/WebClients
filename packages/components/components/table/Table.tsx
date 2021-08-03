import * as React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> {
    children: React.ReactNode;
    className?: string;
    caption?: string;
}

const Table = ({ children, className, caption, ...props }: Props) => {
    return (
        <table className={classnames(['simple-table', className])} {...props}>
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            {children}
        </table>
    );
};

export default Table;
