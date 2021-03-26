import React from 'react';
import { CircleLoader } from '../loader';

const TableCellBusy = () => (
    <td className="text-center" aria-busy="true">
        <CircleLoader />
    </td>
);

export default TableCellBusy;
