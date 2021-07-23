import React from 'react';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
    children?: React.ReactNode;
    caption?: string;
    useDragHandle?: boolean;
}

const OrderableTable = ({ children = [], className = '', caption, useDragHandle = true, ...props }: Props) => (
    <OrderableContainer helperClass="orderableHelper simple-table" useDragHandle={useDragHandle} {...props}>
        <Table caption={caption} className={classnames(['orderableTable', className])}>
            {children}
        </Table>
    </OrderableContainer>
);

export default OrderableTable;
