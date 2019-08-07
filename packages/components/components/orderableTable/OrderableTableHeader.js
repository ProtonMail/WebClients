import React from 'react';
import PropTypes from 'prop-types';

import { TableHeader } from '../table';
import './OrderableTableHeader.scss';

const OrderableTableHeader = ({ cells = [], className = '', children, ...rest }) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells
        ]}
        className={`orderableTableHeader ${className}`}
        {...rest}
    >
        {children}
    </TableHeader>
);

OrderableTableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node),
    className: PropTypes.string,
    children: PropTypes.node
};

export default OrderableTableHeader;
