import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { TableHeader } from '../table';

import './OrderableTableHeader.scss';

interface Props {
    cells?: ReactNode[];
    className?: string;
    children?: ReactNode;
}

const OrderableTableHeader = ({ cells = [], className = '', children = null, ...rest }: Props) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells,
        ]}
        className={clsx(['orderableTableHeader', className])}
        {...rest}
    >
        {children}
    </TableHeader>
);

export default OrderableTableHeader;
