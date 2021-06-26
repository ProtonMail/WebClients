import React from 'react';
import PropTypes from 'prop-types';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';
import { classnames } from '../../helpers';

const OrderableTable = ({ children = [], className = '', caption = undefined, ...props }) => (
    <OrderableContainer helperClass="orderableHelper simple-table" useDragHandle {...props}>
        <Table caption={caption} className={classnames(['orderableTable', className])}>
            {children}
        </Table>
    </OrderableContainer>
);

OrderableTable.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    caption: PropTypes.string,
};

export default OrderableTable;
