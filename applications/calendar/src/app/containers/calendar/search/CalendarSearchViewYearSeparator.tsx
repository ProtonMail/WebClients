import React from 'react';

interface Props {
    year: number;
}

const CalendarSearchViewYearSeparator = ({ year }: Props) => {
    return (
        <div className="flex flex-nowrap border-bottom border-weak w100 px-2 py-0.5 on-tablet-flex-column">
            <div className="flex-no-min-children flex-item-noshrink my-1 py-1">
                <h3 className="text-rg text-no-bold min-w5e text-center">{year}</h3>
            </div>
        </div>
    );
};

export default CalendarSearchViewYearSeparator;
