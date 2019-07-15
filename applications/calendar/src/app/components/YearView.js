import React from 'react';
import PropTypes from 'prop-types';
import {} from 'react-components';

const YearView = ({ currentDate, schedules }) => {
    console.log(currentDate, schedules);
    return <>TODO</>;
};

YearView.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    schedules: PropTypes.array
};

export default YearView;
