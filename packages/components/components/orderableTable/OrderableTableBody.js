import React from 'react';
import PropTypes from 'prop-types';

import { TableBody } from '../table';

const OrderableTableBody = ({ colSpan, ...rest }) => <TableBody {...rest} colSpan={colSpan + 1} />;

OrderableTableBody.propTypes = {
    colSpan: PropTypes.number,
};

export default OrderableTableBody;
