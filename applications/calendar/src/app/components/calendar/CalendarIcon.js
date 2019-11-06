import React from 'react';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import { Icon, classnames } from 'react-components';

const CalendarIcon = ({ color, className }) => {
    const colorModel = tinycolor(color);
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';
    if (!iconColor) {
        return null;
    }
    return <Icon className={classnames(['flex-item-noshrink', className])} name="calendar" color={iconColor} />;
};

CalendarIcon.propTypes = {
    color: PropTypes.string,
    className: PropTypes.string
};

export default CalendarIcon;
