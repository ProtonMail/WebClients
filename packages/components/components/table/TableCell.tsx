import { ReactNode, ThHTMLAttributes } from 'react';

interface Props extends ThHTMLAttributes<HTMLTableCellElement> {
    children: ReactNode;
    label?: ReactNode | string;
    type?: 'body' | 'header' | 'footer';
}

/**
 * TableCell with type 'header' is deprecated. Please use TableHeaderCell component for header cells.
 */
const TableCell = ({ children, label, type = 'body', ...rest }: Props) => {
    if (type === 'header' || type === 'footer') {
        return (
            <th scope="col" {...rest}>
                {children}
            </th>
        );
    }

    return (
        <td role="cell" {...rest}>
            {label && <p className="simple-table__th-small">{label}</p>}
            {children}
        </td>
    );
};

export default TableCell;
