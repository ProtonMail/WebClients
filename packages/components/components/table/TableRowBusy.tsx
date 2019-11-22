import React from 'react';

interface Props {
    colSpan: number;
}

const TableRowBusy = ({ colSpan }: Props) => (
    <tr aria-busy="true">
        <td colSpan={colSpan} />
    </tr>
);

export default TableRowBusy;
