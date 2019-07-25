import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import { TableRow } from '../table';
import { OrderableElement, OrderableHandle } from '../orderable';

const OrderableTableRow = ({ index, cells, ...rest }) => (
    <OrderableElement index={index}>
        <TableRow
            cells={[
                <OrderableHandle key="icon">
                    <Icon style={{ cursor: 'row-resize' }} name="text-justify" />
                </OrderableHandle>,
                ...cells
            ]}
            {...rest}
        />
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
