import { ReactNode } from 'react';
import { SortableContainerProps } from 'react-sortable-hoc';

import { classnames } from '../../helpers';
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
    <OrderableContainer
        helperClass={classnames(['orderableHelper simple-table', helperClassname])}
        useDragHandle
        {...props}
    >
        <Table caption={caption} className={classnames(['orderableTable', className])}>
            {children}
        </Table>
    </OrderableContainer>
);

export default OrderableTable;
