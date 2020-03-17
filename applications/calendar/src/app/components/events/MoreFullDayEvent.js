import React from 'react';

const MoreFullDayEvent = ({ style, more, eventRef }) => {
    return (
        <div style={style} className="calendar-dayeventcell absolute">
            <button
                type="button"
                className="
                    calendar-dayeventcell-inner
                    calendar-dayeventcell-inner--isNotAllDay
                    calendar-dayeventcell-inner--isLoaded
                    ellipsis
                    inline-flex
                    alignleft
                    w100
                    pl0-5
                    pr0-5
                "
                ref={eventRef}
            >
                <span data-test-id="calendar-view:more-events-collapsed" className="mtauto mbauto">
                    {more} more
                </span>
            </button>
        </div>
    );
};

export default MoreFullDayEvent;
