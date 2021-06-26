import React from 'react';

interface Props {
    hours: Date[];
}
const HourLines = ({ hours }: Props) => {
    return (
        <div className="calendar-grid-hours">
            {hours.map((hour) => {
                return <div className="calendar-grid-hourLine" key={hour.getUTCHours()} />;
            })}
        </div>
    );
};

export default HourLines;
