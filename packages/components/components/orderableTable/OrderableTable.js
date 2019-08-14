import React from 'react';
import PropTypes from 'prop-types';

import { Table } from '../table';
import OrderableContainer from '../orderable/OrderableContainer';
import './OrderableTable.scss';

const OrderableTable = ({ children = [], className = '', caption, ...props }) => (
    <OrderableContainer helperClass="orderableHelper pm-simple-table" useDragHandle {...props}>
        <Table caption={caption} className={`orderableTable ${className}`}>
            {children}
        </Table>
    </OrderableContainer>
);

OrderableTable.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    caption: PropTypes.string
};

export default OrderableTable;
