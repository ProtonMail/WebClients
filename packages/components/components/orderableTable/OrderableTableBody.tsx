import React from 'react';

import { TableBody } from '../table';

interface Props {
    children?: React.ReactNode;
    colSpan?: number;
    loading?: boolean;
}

const OrderableTableBody = ({ children, colSpan = 0, loading, ...rest }: Props) => (
    <TableBody {...rest} colSpan={colSpan + 1} loading={loading}>
        {children}
    </TableBody>
);

export default OrderableTableBody;
