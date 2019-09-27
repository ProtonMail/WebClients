import React from 'react';
import PropTypes from 'prop-types';

const PublicHeader = ({ left, middle, right }) => (
    <header className="flex-item-noshrink flex flex-items-center noprint mb2">
        <div className="nomobile flex-item-fluid">{left}</div>
        <div className="w150p center">{middle}</div>
        <div className="nomobile flex-item-fluid alignright">{right}</div>
    </header>
);

PublicHeader.propTypes = {
    left: PropTypes.node,
    middle: PropTypes.node,
    right: PropTypes.node
};

export default PublicHeader;
