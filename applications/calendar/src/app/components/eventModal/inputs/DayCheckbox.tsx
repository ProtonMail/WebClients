import React from 'react';

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    id: string;
    dayLong: string;
    dayAbbreviation: string;
}

const DayCheckbox = ({ id, dayAbbreviation, dayLong, ...rest }: Props) => {
    return (
        <label htmlFor={id} className="mr1 inline-flex">
            <input id={id} type="checkbox" className="day-checkbox sr-only" {...rest} />
            <span className="day-icon flex-item-noshrink rounded50 inline-flex">
                <span className="mauto item-abbr" aria-hidden="true">
                    {dayAbbreviation}
                </span>
                <span className="sr-only">{dayLong}</span>
            </span>
        </label>
    );
};

export default DayCheckbox;
