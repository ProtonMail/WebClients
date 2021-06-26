import React from 'react';
import PropTypes from 'prop-types';

import { TableHeader } from '../table';
import './OrderableTableHeader.scss';
import { classnames } from '../../helpers';

const OrderableTableHeader = ({ cells = [], className = '', children = null, ...rest }) => (
    <TableHeader
        cells={[
            null, // column for icon
            ...cells,
        ]}
        className={classnames(['orderableTableHeader', className])}
        {...rest}
    >
        {children}
    </TableHeader>
);

OrderableTableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node),
    className: PropTypes.string,
    children: PropTypes.node,
};

export default OrderableTableHeader;
