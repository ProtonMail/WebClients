import { type ReactNode, type ThHTMLAttributes, forwardRef } from 'react';

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
    ({ children, label, type = 'body', 'data-testid': dataTestId, ...rest }, ref) => {
        if (type === 'header' || type === 'footer') {
            return (
                <th scope="col" {...rest} ref={ref}>
                    {children}
                </th>
            );
        }

        return (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role -- responsive styles set `display: block`, which drops the implicit table semantics
            <td role="cell" {...rest} data-testid={dataTestId} ref={ref}>
                {label && <p className="simple-table__th-small">{label}</p>}
                {children}
            </td>
        );
    }
);

TableCell.displayName = 'TableCell';

export default TableCell;
