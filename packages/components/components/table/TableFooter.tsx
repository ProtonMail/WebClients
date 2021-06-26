import React from 'react';
import TableCell from './TableCell';

interface Props extends React.HTMLAttributes<HTMLTableSectionElement> {
    cells: React.ReactNode[];
}

const TableFooter = ({ cells = [], ...rest }: Props) => {
    return (
        <tfoot {...rest}>
            <tr>
                {cells.map((cell, index) => (
                    <TableCell key={index.toString()}>{cell}</TableCell>
                ))}
            </tr>
        </tfoot>
    );
};

export default TableFooter;
