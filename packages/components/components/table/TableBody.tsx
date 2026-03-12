import { type CSSProperties, type ReactNode, type RefObject, forwardRef } from 'react';

import TableRowBusy from './TableRowBusy';

interface Props {
    children: ReactNode;
    colSpan?: number;
    loading?: boolean;
    style?: CSSProperties;
    ref?: RefObject<HTMLTableSectionElement>;
}

const TableBody = forwardRef<HTMLTableSectionElement, Props>(({ children, loading = false, colSpan, ...rest }, ref) => {
    return (
        <tbody ref={ref} {...rest}>
            {loading ? <TableRowBusy colSpan={colSpan} /> : children}
        </tbody>
    );
});

export default TableBody;

TableBody.displayName = 'TableBody';
