import React from 'react';

import { TableBody } from '../table';

interface Props {
    children: React.ReactNode;
    colSpan?: number;
}

const OrderableTableBody = ({ children, colSpan = 0, ...rest }: Props) => (
    <TableBody {...rest} colSpan={colSpan + 1}>
        {children}
    </TableBody>
);

export default OrderableTableBody;
