import { ReactNode } from 'react';
import { SortableContainerProps } from 'react-sortable-hoc';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';
import { classnames } from '../../helpers';

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
