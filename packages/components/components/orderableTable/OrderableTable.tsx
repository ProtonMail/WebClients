import * as React from 'react';
import { SortableContainerProps } from 'react-sortable-hoc';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';
import { classnames } from '../../helpers';

interface Props extends SortableContainerProps {
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
