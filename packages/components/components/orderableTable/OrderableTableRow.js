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
                    <span className="flex">
                        <Icon className="mtauto mbauto cursor-row-resize" name="text-justify" />
                    </span>
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
