import React from 'react';
import PropTypes from 'prop-types';

import { getClasses } from '../../helpers/component';

const Table = ({ children, className }) => {
    return (
        <table className={getClasses('pm-simple-table', className)}>{children}</table>
    );
};

Table.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

Table.defaultProps = {
    children: []
};

export default Table;