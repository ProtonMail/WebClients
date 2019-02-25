import React from 'react';
import PropTypes from 'prop-types';
import readableTime from 'proton-shared/lib/helpers/readableTime';

const Time = ({ children, format, ...rest }) => <time {...rest}>{readableTime(children, format)}</time>;

Time.propTypes = {
    children: PropTypes.number.isRequired,
    format: PropTypes.string
};

Time.defaultProps = {
    children: 0,
    format: 'LL'
};

export default Time;