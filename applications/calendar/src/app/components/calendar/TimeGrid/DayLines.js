import React from 'react';

const DayLines = ({ days }) => {
    return (
        <div className="flex">
            {days.map((day) => {
                return <div className="calendar-grid-dayLine flex-item-fluid" key={day.getUTCDate()} />;
            })}
        </div>
    );
};

export default React.memo(DayLines);
