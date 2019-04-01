import React from 'react';
import PropTypes from 'prop-types';

const Table = ({ children, className }) => {
    return <table className={`pm-simple-table ${className}`}>{children}</table>;
};

Table.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

Table.defaultProps = {
    children: [],
    className: ''
};

export default Table;
