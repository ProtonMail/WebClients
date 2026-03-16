import type { DetailedHTMLProps, ReactNode, TableHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> {
    children: ReactNode;
    className?: string;
    caption?: string;
    responsive?: 'cards' | 'stacked';
    hasActions?: boolean;
    borderWeak?: boolean;
    lastRowNoBorder?: boolean;
    noInlinePadding?: boolean;
}

const Table = ({
    children,
    responsive,
    className,
    hasActions,
    caption,
    borderWeak,
    lastRowNoBorder,
    noInlinePadding,
    ...props
}: Props) => {
    return (
        <div className="simple-table-wrapper">
            <table
                className={clsx([
                    'simple-table',
                    responsive === 'cards' && 'simple-table--responsive simple-table--responsive-cards',
                    responsive === 'stacked' && 'simple-table--responsive simple-table--responsive-stacked',
                    hasActions && 'simple-table--has-actions',
                    borderWeak && 'simple-table--border-weak',
                    lastRowNoBorder && 'simple-table--last-row-no-border',
                    noInlinePadding && 'simple-table--no-inline-padding',
                    className,
                ])}
                {...props}
            >
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                {children}
            </table>
        </div>
    );
};

export default Table;
