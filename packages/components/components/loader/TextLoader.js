import React from 'react';
import PropTypes from 'prop-types';

const TextLoader = ({ children }) => {
    return <p className="atomLoader-text">{children}</p>;
};

TextLoader.propTypes = {
    children: PropTypes.node
};

export default TextLoader;
