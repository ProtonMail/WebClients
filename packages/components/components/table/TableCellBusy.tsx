import { ComponentPropsWithoutRef } from 'react';

import { CircleLoader } from '@proton/atoms';

import { classnames } from '../../helpers';

interface Props extends ComponentPropsWithoutRef<'td'> {
    colSpan?: number;
}

const TableCellBusy = ({ colSpan, className }: Props) => (
    <td colSpan={colSpan} className={classnames([className, 'text-center'])} aria-busy="true">
        <CircleLoader />
    </td>
);

export default TableCellBusy;
