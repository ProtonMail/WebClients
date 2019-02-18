import React from 'react';
import PropTypes from 'prop-types';

const Loader = ({ className }) => <div className={className} aria-busy="true" />;

Loader.propTypes = {
    className: PropTypes.string
};

export default Loader;