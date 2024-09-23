import type { ReactNode } from 'react';

import TableBody from '@proton/components/components/table/TableBody';

interface Props {
    children?: ReactNode;
    colSpan?: number;
    loading?: boolean;
}

const OrderableTableBody = ({ children, colSpan = 0, loading, ...rest }: Props) => (
    <TableBody {...rest} colSpan={colSpan + 1} loading={loading}>
        {children}
    </TableBody>
);

export default OrderableTableBody;
