import React from 'react';

const MoreFullDayEvent = ({ style, more, eventRef }) => {
    return (
        <button type="button" style={style} className="calendar-dayeventcell absolute">
            <span className="calendar-dayeventcell-inner inbl alignleft w100 pl0-5 pr0-5" ref={eventRef}>
                {more} more
            </span>
        </button>
    );
};

export default MoreFullDayEvent;
