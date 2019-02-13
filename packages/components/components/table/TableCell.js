import React from 'react';
import PropTypes from 'prop-types';

const TableCell = ({ children, type, ...rest }) => {
    if (type === 'header' || type === 'footer') {
        return <th scope="col" {...rest}>{children}</th>;
    }

    return <td {...rest}>{children}</td>;
};

TableCell.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    type: PropTypes.string
};

TableCell.defaultProps = {
    type: 'body'
};

export default TableCell;