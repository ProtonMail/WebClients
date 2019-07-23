import React from 'react';
import PropTypes from 'prop-types';

import { TableHeader } from '../table';
import './OrderableTableHeader.scss';

const OrderableTableHeader = ({ cells, className, ...rest }) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells
        ]}
        className={`orderableTableHeader ${className}`}
        {...rest}
    ></TableHeader>
);

OrderableTableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node),
    className: PropTypes.string
};

OrderableTableHeader.defaultProps = {
    cells: [],
    className: ''
};

export default OrderableTableHeader;
