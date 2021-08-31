import { ReactNode } from 'react';
import TableRowBusy from './TableRowBusy';

interface Props {
    children: ReactNode;
    colSpan?: number;
    loading?: boolean;
}

const TableBody = ({ children, loading = false, colSpan, ...rest }: Props) => {
    return <tbody {...rest}>{loading ? <TableRowBusy colSpan={colSpan} /> : children}</tbody>;
};

export default TableBody;
