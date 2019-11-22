import React from 'react';
import TableCell from './TableCell';

interface Props extends React.HTMLAttributes<HTMLTableRowElement> {
    cells: React.ReactNode[];
}

const TableRow = ({ cells = [], ...rest }: Props) => {
    return (
        <tr {...rest}>
            {cells.map((cell, index) => (
                <TableCell key={index.toString()}>{cell}</TableCell>
            ))}
        </tr>
    );
};

export default TableRow;
