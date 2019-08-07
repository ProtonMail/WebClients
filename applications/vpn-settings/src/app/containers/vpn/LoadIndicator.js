import React from 'react';
import PropTypes from 'prop-types';

const LoadIndicator = ({ server: { Load = 0 } }) => (
    <>
        <div className="load-indicator">
            <div className="load-indicator-overlay" style={{ marginTop: `${-Load * 50}%` }}></div>
        </div>
        <div className="ml0-5">{Load}%</div>
    </>
);

LoadIndicator.propTypes = {
    server: PropTypes.shape({
        Load: PropTypes.number
    })
};

export default LoadIndicator;
