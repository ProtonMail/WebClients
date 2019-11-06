import React from 'react';

const MoreFullDayEvent = ({ style, more, eventRef }) => {
    return (
        <div style={style} className="dayeventcell absolute">
            <div className="dayeventcell--inner" ref={eventRef}>
                {more} more
            </div>
        </div>
    );
};

export default MoreFullDayEvent;
