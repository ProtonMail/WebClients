import { ReactNode } from 'react';
import { SortableContainerProps } from 'react-sortable-hoc';

import clsx from '@proton/utils/clsx';

import OrderableContainer from '../orderable/OrderableContainer';
import { Table } from '../table';

import './OrderableTable.scss';

interface Props extends SortableContainerProps {
    className?: string;
    helperClassname?: string;
    children?: ReactNode;
    caption?: string;
}

const OrderableTable = ({ children = [], className = '', helperClassname, caption, ...props }: Props) => (
    <OrderableContainer helperClass={clsx(['orderableHelper simple-table', helperClassname])} useDragHandle {...props}>
        <Table caption={caption} className={clsx(['orderableTable', className])}>
            {children}
        </Table>
    </OrderableContainer>
);

export default OrderableTable;
