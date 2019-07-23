import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import { TableRow } from '../table';
import OrderableElement from '../orderable/OrderableElement';

const OrderableTableRow = ({ index, cells, ...rest }) => (
    <OrderableElement index={index}>
        <TableRow cells={[<Icon key="icon" name="text-justify" />, ...cells]} {...rest} />
    </OrderableElement>
);

OrderableTableRow.propTypes = {
    index: PropTypes.number.isRequired,
    cells: PropTypes.arrayOf(PropTypes.node)
};

OrderableTableRow.defaultProps = {
    cells: []
};

export default OrderableTableRow;
