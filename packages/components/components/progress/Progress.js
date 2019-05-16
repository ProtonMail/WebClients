import React from 'react';
import PropTypes from 'prop-types';

const Progress = ({ value, max, ...rest }) => <progress className="progressBar" value={value} max={max} {...rest} />;

Progress.propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired
};

Progress.defaultProps = {
    value: 50,
    max: 100
};

export default Progress;
