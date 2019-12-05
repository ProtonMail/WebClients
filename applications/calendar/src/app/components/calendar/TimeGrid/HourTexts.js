import React from 'react';

const HourTexts = ({ className, hours }) => {
    return (
        <div className={className}>
            {hours.map((text, i) => {
                return (
                    <div className="calendar-grid-timeBlock" key={i}>
                        {i === 0 ? null : (
                            <span className="calendar-grid-timeText aligncenter bl relative">{text}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(HourTexts);
