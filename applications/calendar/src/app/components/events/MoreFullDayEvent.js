import React from 'react';

const MoreFullDayEvent = ({ style, more, eventRef }) => {
    return (
        <button type="button" style={style} className="calendar-dayeventcell absolute">
            <span
                className="calendar-dayeventcell-inner calendar-dayeventcell-inner--notAllDay ellipsis inline-flex alignleft w100 pl0-5 pr0-5"
                ref={eventRef}
            >
                <span data-test-id="calendar-view:more-events-collapsed" className="mtauto mbauto">
                    {more} more
                </span>
            </span>
        </button>
    );
};

export default MoreFullDayEvent;
