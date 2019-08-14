import React from 'react';
import PropTypes from 'prop-types';
import readableTime from 'proton-shared/lib/helpers/readableTime';

const Time = ({ children = 0, format = 'LL', ...rest }) => <time {...rest}>{readableTime(children, format)}</time>;

Time.propTypes = {
    children: PropTypes.number,
    format: PropTypes.string
};

export default Time;
