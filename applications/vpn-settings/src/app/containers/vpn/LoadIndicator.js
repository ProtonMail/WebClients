import React from 'react';
import PropTypes from 'prop-types';

const LoadIndicator = ({ load = 0 }) => (
    <>
        <div className="load-indicator">
            <div className="load-indicator-overlay" style={{ marginTop: `${-load * 50}%` }}></div>
        </div>
        <div className="ml0-5">{load}%</div>
    </>
);

LoadIndicator.propTypes = {
    load: PropTypes.number
};

export default LoadIndicator;
