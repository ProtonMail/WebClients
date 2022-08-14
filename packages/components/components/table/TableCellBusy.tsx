import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';
import { CircleLoader } from '../loader';

interface Props extends ComponentPropsWithoutRef<'td'> {
    colSpan?: number;
}

const TableCellBusy = ({ colSpan, className }: Props) => (
    <td colSpan={colSpan} className={classnames([className, 'text-center'])} aria-busy="true">
        <CircleLoader />
    </td>
);

export default TableCellBusy;
