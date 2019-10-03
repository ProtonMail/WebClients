import React from 'react';
import PropTypes from 'prop-types';

// eslint-disable-next-line
const View = ({ mailSettings }) => {
    return <div className="view-column-detail p2 flex-item-fluid scroll-if-needed"></div>;
};

View.propTypes = {
    mailSettings: PropTypes.object.isRequired
};

export default View;
