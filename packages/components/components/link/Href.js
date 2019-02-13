import React from 'react';
import PropTypes from 'prop-types';

const Href = ({ url, children }) => {
    return <a href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
};

Href.propTypes = {
    url: PropTypes.string,
    children: PropTypes.node.isRequired
};

Href.defaultProps = {
    url: '#'
};

export default Href;