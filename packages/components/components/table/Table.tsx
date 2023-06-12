import { DetailedHTMLProps, ReactNode, TableHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> {
    children: ReactNode;
    className?: string;
    caption?: string;
    responsive?: 'cards' | 'stacked';
    hasActions?: boolean;
}

const Table = ({ children, responsive, className, hasActions, caption, ...props }: Props) => {
    return (
        <table
            className={clsx([
                'simple-table',
                responsive === 'cards' && 'simple-table--responsive simple-table--responsive-cards',
                responsive === 'stacked' && 'simple-table--responsive simple-table--responsive-stacked',
                hasActions && 'simple-table--has-actions',
                className,
            ])}
            {...props}
        >
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            {children}
        </table>
    );
};

export default Table;
