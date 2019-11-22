import React from 'react';

interface Props extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
    children: React.ReactNode;
    type?: 'body' | 'header' | 'footer';
}

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
