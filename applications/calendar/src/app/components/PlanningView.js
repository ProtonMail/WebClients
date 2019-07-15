import React from 'react';
import PropTypes from 'prop-types';

const PlanningView = ({ currentDate, schedules }) => {
    console.log(currentDate, schedules);
    return <>TODO</>;
};

PlanningView.propTypes = {
    currentDate: PropTypes.instanceOf(Date),
    schedules: PropTypes.array
};

export default PlanningView;
