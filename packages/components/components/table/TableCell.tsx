import { ReactNode, ThHTMLAttributes } from 'react';

interface Props extends ThHTMLAttributes<HTMLTableCellElement> {
    children: ReactNode;
    type?: 'body' | 'header' | 'footer';
}

/**
 * TableCell with type 'header' is deprecated. Please use TableHeaderCell component for header cells.
 */
const TableCell = ({ children, type = 'body', ...rest }: Props) => {
    if (type === 'header' || type === 'footer') {
        return (
            <th scope="col" {...rest}>
                {children}
            </th>
        );
    }

    return <td {...rest}>{children}</td>;
};

export default TableCell;
