import React from 'react';

const HourLines = ({ hours }) => {
    return (
        <div className="calendar-grid-hours">
            {hours.map((hour) => {
                return <div className="calendar-grid-hourLine" key={hour.getUTCHours()} />;
            })}
        </div>
    );
};

export default HourLines;
