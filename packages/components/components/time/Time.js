import React from 'react';
import PropTypes from 'prop-types';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';

const Time = ({ children = 0, format = 'PP', options = { locale: dateLocale }, ...rest }) => (
    <time {...rest}>{readableTime(children, format, options)}</time>
);

Time.propTypes = {
    children: PropTypes.number.isRequired,
    format: PropTypes.string,
    options: PropTypes.object
};

export default Time;
