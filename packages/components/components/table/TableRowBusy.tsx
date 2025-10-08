import type { ComponentPropsWithoutRef } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

interface Props extends ComponentPropsWithoutRef<'tr'> {
    colSpan?: number;
}

const TableRowBusy = ({ colSpan, ...rest }: Props) => (
    <tr aria-busy="true" {...rest}>
        <td colSpan={colSpan}>
            <div className="w-full text-center">
                <CircleLoader />
            </div>
        </td>
    </tr>
);

export default TableRowBusy;
