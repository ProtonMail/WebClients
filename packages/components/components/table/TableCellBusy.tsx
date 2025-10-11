import type { ComponentPropsWithoutRef } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'td'> {
    colSpan?: number;
}

const TableCellBusy = ({ colSpan, className }: Props) => (
    <td colSpan={colSpan} className={clsx([className, 'text-center'])} aria-busy="true">
        <CircleLoader />
    </td>
);

export default TableCellBusy;
