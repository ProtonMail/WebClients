import React from 'react';
import PropTypes from 'prop-types';

const LocationAside = ({ action, unread = 0 }) => {
    return (
        <>
            {action}
            {unread ? <span className="navigation__counterItem flex-item-noshrink rounded">{unread}</span> : null}
        </>
    );
};

LocationAside.propTypes = {
    action: PropTypes.node,
    unread: PropTypes.number.isRequired
};

export default LocationAside;
