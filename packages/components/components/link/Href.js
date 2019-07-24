import React from 'react';
import PropTypes from 'prop-types';

const Href = ({ url, className, target, rel, children }) => {
    return (
        <a href={url} className={className} target={target} rel={rel}>
            {children}
        </a>
    );
};

Href.propTypes = {
    url: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string
};

Href.defaultProps = {
    url: '#',
    target: '_blank',
    rel: 'noopener noreferrer'
};

export default Href;
