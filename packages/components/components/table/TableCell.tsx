import { forwardRef, type ReactNode, type ThHTMLAttributes } from 'react';

interface Props extends ThHTMLAttributes<HTMLTableCellElement> {
    children: ReactNode;
    label?: ReactNode | string;
    type?: 'body' | 'header' | 'footer';
    'data-testid'?: string;
}

/**
 * TableCell with type 'header' is deprecated. Please use TableHeaderCell component for header cells.
 */
const TableCell = forwardRef<HTMLTableCellElement, Props>(
    (
        { children, label, type = 'body', 'data-testid': dataTestId, ...rest },
        ref
    ) => {
    if (type === 'header' || type === 'footer') {
        return (
            <th scope="col" {...rest} ref={ref}>
                {children}
            </th>
        );
    }

    return (
        <td role="cell" {...rest} data-testid={dataTestId} ref={ref}>
            {label && <p className="simple-table__th-small">{label}</p>}
            {children}
        </td>
    );
});

TableCell.displayName = 'TableCell';

export default TableCell;
