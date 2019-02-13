import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const getTime = (time) => dayjs.unix(time).format('YYYY-MM-DD HH:mm:ss');
const Time = ({ children, ...rest }) => <time {...rest}>{getTime(children)}</time>;

Time.propTypes = {
    children: PropTypes.number.isRequired
};

Time.defaultProps = {
    children: 0
};

export default Time;