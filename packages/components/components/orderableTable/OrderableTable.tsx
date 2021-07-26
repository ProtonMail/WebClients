import React from 'react';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
    children?: React.ReactNode;
    caption?: string;
}

const OrderableTable = ({ children = [], className = '', caption, ...props }: Props) => (
    <OrderableContainer helperClass="orderableHelper simple-table" useDragHandle {...props}>
        <Table caption={caption} className={classnames(['orderableTable', className])}>
            {children}
        </Table>
    </OrderableContainer>
);

export default OrderableTable;
