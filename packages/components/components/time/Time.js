import React from 'react';
import PropTypes from 'prop-types';
import readableTime from 'proton-shared/lib/helpers/readableTime';

const Time = ({ children, ...rest }) => <time {...rest}>{readableTime(children)}</time>;

Time.propTypes = {
    children: PropTypes.number.isRequired
};

Time.defaultProps = {
    children: 0
};

export default Time;