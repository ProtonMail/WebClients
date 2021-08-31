import { HTMLAttributes, ReactNode } from 'react';
import TableCell from './TableCell';

interface Props extends HTMLAttributes<HTMLTableSectionElement> {
    cells?: ReactNode[];
    children?: ReactNode;
}

const TableHeader = ({ cells = [], children, ...rest }: Props) => {
    return (
        <thead {...rest}>
            {children || (
                <tr>
                    {cells.map((cell, index) => (
                        <TableCell key={index.toString()} type="header">
                            {cell}
                        </TableCell>
                    ))}
                </tr>
            )}
        </thead>
    );
};

export default TableHeader;
