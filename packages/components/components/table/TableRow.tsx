import React from 'react';
import TableCell from './TableCell';

interface Props extends React.HTMLAttributes<HTMLTableRowElement> {
    cells?: React.ReactNode[];
    children?: React.ReactNode;
}

const TableRow = ({ cells = [], children, ...rest }: Props) => {
    return (
        <tr {...rest}>
            {children || cells.map((cell, index) => <TableCell key={index.toString()}>{cell}</TableCell>)}
        </tr>
    );
};

export default TableRow;
