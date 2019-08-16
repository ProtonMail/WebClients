import React from 'react';
import PropTypes from 'prop-types';

const CalendarToolbar = ({ dateRange, dateCursorButtons, timezoneSelector, viewSelector }) => {
    return (
        <div className="toolbar noprint">
            <div className="flex flex-spacebetween">
                <div className="flex flex-items-center">{dateCursorButtons}</div>
                <div>
                    {dateRange[0].toISOString()} - {dateRange[1].toISOString()}
                </div>
                <div className="flex flex-nowrap">
                    {timezoneSelector}
                    {viewSelector}
                </div>
            </div>
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
