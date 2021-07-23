import React from 'react';

import Icon from '../icon/Icon';
import { TableRow } from '../table';
import { OrderableElement, OrderableHandle } from '../orderable';

interface Props {
    index: number;
    cells?: React.ReactNode[];
}

const OrderableTableRow = ({ index, cells = [], ...rest }: Props) => (
    <OrderableElement index={index}>
        <TableRow
            cells={[
                <OrderableHandle key="icon">
                    <span className="flex" data-testid="table:order-icon">
                        <Icon className="mtauto mbauto cursor-row-resize" name="text-justify" />
                    </span>
                </OrderableHandle>,
                ...cells,
            ]}
            {...rest}
        />
    </OrderableElement>
);

export default OrderableTableRow;
