import React from 'react';
import PropTypes from 'prop-types';

const CalendarToolbar = ({ dateCursorButtons, timezoneSelector, viewSelector }) => {
    return (
        <div className="toolbar flex flex-nowrap noprint no-scroll">
            {dateCursorButtons}
            <span className="mlauto toolbar-separator" />
            {timezoneSelector}
            <span className="toolbar-separator notablet nomobile" />
            {viewSelector}
        </div>
    );
};

CalendarToolbar.propTypes = {
    dateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    dateCursorButtons: PropTypes.node.isRequired,
    timezoneSelector: PropTypes.node.isRequired,
    viewSelector: PropTypes.node.isRequired
};

export default CalendarToolbar;
