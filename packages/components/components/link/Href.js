import React from 'react';
import PropTypes from 'prop-types';

const Href = ({ url = '#', target = '_blank', rel = 'noopener noreferrer', children, ...rest }) => (
    <a href={url} target={target} rel={rel} {...rest}>
        {children}
    </a>
);

Href.propTypes = {
    url: PropTypes.string,
    children: PropTypes.node.isRequired,
    target: PropTypes.string,
    rel: PropTypes.string
};

export default Href;
