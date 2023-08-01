import React from 'react';

interface Props {
    year: number;
}

const CalendarSearchViewYearSeparator = ({ year }: Props) => {
    return (
        <div className="border-bottom border-weak px-4 py-3">
            <h3 className="text-rg text-no-bold">{year}</h3>
        </div>
    );
};

export default CalendarSearchViewYearSeparator;
