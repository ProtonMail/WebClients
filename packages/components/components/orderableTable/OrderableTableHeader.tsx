import * as React from 'react';

import { TableHeader } from '../table';
import './OrderableTableHeader.scss';
import { classnames } from '../../helpers';

interface Props {
    cells?: React.ReactNode[];
    className?: string;
    children?: React.ReactNode;
}

const OrderableTableHeader = ({ cells = [], className = '', children = null, ...rest }: Props) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells,
        ]}
        className={classnames(['orderableTableHeader', className])}
        {...rest}
    >
        {children}
    </TableHeader>
);

export default OrderableTableHeader;
