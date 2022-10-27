import { ComponentPropsWithoutRef } from 'react';

import { CircleLoader } from '@proton/atoms';

interface Props extends ComponentPropsWithoutRef<'tr'> {
    colSpan?: number;
}

const TableRowBusy = ({ colSpan, ...rest }: Props) => (
    <tr aria-busy="true" {...rest}>
        <td colSpan={colSpan} className="text-center">
            <CircleLoader />
        </td>
    </tr>
);

export default TableRowBusy;
