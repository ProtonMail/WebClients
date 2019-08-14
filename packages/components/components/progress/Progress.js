import React from 'react';
import PropTypes from 'prop-types';

const Progress = ({ value = 50, max = 100, ...rest }) => (
    <progress className="progressBar" value={value} max={max} {...rest} />
);

Progress.propTypes = {
    value: PropTypes.number,
    max: PropTypes.number
};

export default Progress;
